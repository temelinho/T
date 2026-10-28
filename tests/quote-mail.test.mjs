import test from 'node:test';
import assert from 'node:assert/strict';
import { createQuoteHandler } from '../server/quote-mail.mjs';

const env={MAIL_ENABLED:'true',RESEND_API_KEY:'test-key-not-a-real-secret',RESEND_FROM:'Temel Technology <forms@example.com>',QUOTE_TO:'owner@example.com',SITE_ORIGIN:'https://example.com'};
const quote={ad:'Örnek Kişi',email:'visitor@example.net',telefon:'05321234567',sirket:'Örnek Firma',musteri_tipi:'İşletme',hizmetler:['Web sitesi','Dijital reklam (Google / Sosyal medya)'],butce:'Bütçem henüz belli değil',zaman:'Sadece fikir alıyorum',detay:'Yeni bir web sitesi istiyorum.',hedef:'Daha fazla müşteriye ulaşmak',ornek_proje:'Alanya Klima Temizliği',website:''};
const submissionId='b454497c-6db7-4831-bc71-9567665bfd6d';
const request=(changes={},headers={})=>new Request('https://example.com/api/quote',{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json','x-forwarded-for':'192.0.2.10',...headers},body:JSON.stringify({quote:{...quote,...changes},submissionId})});
function setup(response=()=>Response.json({data:[{id:'owner-test-id'},{id:'receipt-test-id'}]})){
 const calls=[];const handler=createQuoteHandler({fetchImpl:async(url,init)=>{const messages=JSON.parse(init.body);calls.push({url,init,mail:messages[0],receipt:messages[1],messages});return response();}});
 return {calls,handler};
}
test('readiness is read-only and hides secrets',async()=>{
 const {handler,calls}=setup();
 const response=await handler(new Request('https://example.com/api/quote'),env);
 assert.deepEqual(await response.json(),{provider:'resend',ready:true});assert.equal(calls.length,0);
 const disabled=await handler(new Request('https://example.com/api/quote'),{...env,MAIL_ENABLED:'false'});
 assert.equal((await disabled.json()).ready,false);
});
test('fixed recipient, reply-to, complete summary and escaped HTML',async()=>{
 const {handler,calls}=setup();const response=await handler(request({detay:'<script>alert(1)</script>\nYeni site',to:'attacker@example.net',from:'attacker@example.net'}),env);
 assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});
 assert.equal(calls[0].url,'https://api.resend.com/emails/batch');assert.deepEqual(calls[0].mail.to,['owner@example.com']);
 assert.equal(calls[0].mail.from,env.RESEND_FROM);assert.equal(calls[0].mail.reply_to,quote.email);
 assert.match(calls[0].mail.text,/Bütçem henüz belli değil/);assert.match(calls[0].mail.text,/Alanya Klima Temizliği/);
 assert.match(calls[0].mail.html,/&lt;script&gt;/);assert.ok(!calls[0].mail.html.includes('<script>'));
});

test('customer receipt is private, branded and replies to the business',async()=>{
 const {handler,calls}=setup();const response=await handler(request({ad:'Ada <img src=x>',detay:'PRIVATE PROJECT DETAILS',sirket:'PRIVATE COMPANY',telefon:'05329876543'}),env);
 assert.equal(response.status,200);const {receipt,messages}=calls[0];
 assert.equal(messages.length,2);assert.deepEqual(receipt.to,[quote.email]);
 assert.equal(receipt.from,env.RESEND_FROM);assert.equal(receipt.reply_to,env.QUOTE_TO);
 assert.equal(receipt.subject,'Talebinizi aldık — Temel Technology');
 assert.match(receipt.html,/Ada &lt;img src=x&gt;/);assert.ok(!receipt.html.includes('<img src=x>'));
 assert.match(receipt.text,/en kısa sürede dönüş yapacağız/);assert.match(receipt.html,/B454497C/);
 assert.match(receipt.html,/https:\/\/temeltechnology.com\/#islerimiz/);
 for(const value of ['PRIVATE PROJECT DETAILS','PRIVATE COMPANY','05329876543'])assert.ok(!receipt.html.includes(value));
 assert.ok(!receipt.bcc && !receipt.cc);
});

test('valid contacts can submit with no project message and phone is normalized',async()=>{
 for(const detail of ['',undefined,' ', 'x']){
  const {handler,calls}=setup();const response=await handler(request({detay:detail,telefon:'+90 (532) 123 45 67'}),env);
  assert.equal(response.status,200);assert.match(calls[0].mail.text,/Telefon: 05321234567/);
  if(!detail?.trim())assert.match(calls[0].mail.text,/Proje detayı paylaşılmadı/);
 }
});

test('invalid contact details cannot send either email',async()=>{
 const {handler,calls}=setup();
 for(const changes of [{telefon:''},{telefon:undefined},{telefon:'123'},{telefon:'053212345678'},{telefon:'+44 5321234567'},{email:'a..b@gmail.com'},{email:'a@gmail..com'},{email:'a@-gmail.com'}]){
  assert.equal((await handler(request(changes),env)).status,400);
 }
 assert.equal(calls.length,0);
});

test('batch must acknowledge both messages before showing success',async()=>{
 for(const result of [{id:'single'}, {data:[{id:'only-one'}]}, {data:[{id:'owner'},{}]}, {data:[{id:'owner'},null]}]){
  const {handler}=setup(()=>Response.json(result));const response=await handler(request(),env);
  assert.equal(response.status,502);assert.equal((await response.json()).error,'result_unknown');
 }
});
test('same request retries use the same Resend idempotency key',async()=>{
 const {handler,calls}=setup();await handler(request(),env);await handler(request(),env);await handler(request({detay:'Değişen proje talebi.'}),env);
 assert.equal(calls[0].init.headers['Idempotency-Key'],calls[1].init.headers['Idempotency-Key']);
 assert.notEqual(calls[0].init.headers['Idempotency-Key'],calls[2].init.headers['Idempotency-Key']);
});
test('untrusted or missing origins cannot send email',async()=>{
 const {handler,calls}=setup();assert.equal((await handler(request({}, {Origin:'https://other.example'}),env)).status,403);
 const noOrigin=request();noOrigin.headers.delete('origin');assert.equal((await handler(noOrigin,env)).status,403);assert.equal(calls.length,0);
});
test('disabled/incomplete settings fail closed',async()=>{
 const {handler,calls}=setup();assert.equal((await handler(request(),{...env,RESEND_API_KEY:''})).status,503);assert.equal(calls.length,0);
});
test('invalid and spam payloads do not call Resend',async()=>{
 const {handler,calls}=setup();
 for(const changes of [{email:'invalid'},{ad:'A\r\nBcc: attacker@example.com'},{website:'https://spam.example'},{hizmetler:['unknown']},{butce:'unknown'},{detay:'x'.repeat(1501)},{ad:'a'},{musteri_tipi:'unknown'}]){
  assert.equal((await handler(request(changes),env)).status,400);
 }
 assert.equal(calls.length,0);
});
test('payload size and content type are bounded',async()=>{
 const {handler,calls}=setup();assert.equal((await handler(request({}, {'Content-Type':'text/plain'}),env)).status,415);
 const large=new Request('https://example.com/api/quote',{method:'POST',headers:{Origin:'https://example.com','Content-Type':'application/json'},body:'x'.repeat(12001)});
 assert.equal((await handler(large,env)).status,413);assert.equal(calls.length,0);
});
test('successful HTTP without a Resend message ID is not success',async()=>{
 const {handler}=setup(()=>Response.json({}));const response=await handler(request(),env);assert.equal(response.status,502);assert.equal((await response.json()).ok,false);
});
test('provider errors do not leak private response data',async()=>{
 const {handler}=setup(()=>Response.json({message:'private upstream detail'},{status:403}));const response=await handler(request(),env);assert.equal(response.status,503);assert.ok(!(await response.text()).includes('private'));
});
test('temporary provider limit and ambiguous timeout have distinct responses',async()=>{
 const limited=setup(()=>new Response('{}',{status:429}));assert.equal((await limited.handler(request(),env)).status,429);
 const timeout=setup(()=>{throw new DOMException('Aborted','AbortError');});const result=await timeout.handler(request(),env);assert.equal(result.status,504);assert.equal((await result.json()).error,'result_unknown');
});
test('burst protection stops a sixth request before it reaches Resend',async()=>{
 const {handler,calls}=setup();for(let i=0;i<5;i++)assert.equal((await handler(request(),env)).status,200);
 const limited=await handler(request(),env);assert.equal(limited.status,429);assert.equal(calls.length,5);assert.ok(Number(limited.headers.get('retry-after'))>0);
});
test('CORS preflight and unsupported methods are handled explicitly',async()=>{
 const {handler,calls}=setup();const preflight=await handler(new Request('https://example.com/api/quote',{method:'OPTIONS',headers:{Origin:'https://example.com'}}),env);
 assert.equal(preflight.status,204);assert.equal(preflight.headers.get('access-control-allow-origin'),'https://example.com');
 assert.equal((await handler(new Request('https://example.com/api/quote',{method:'PUT'}),env)).status,405);assert.equal(calls.length,0);
});
