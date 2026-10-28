import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';
const source=readFileSync(new URL('../mail-delivery.js',import.meta.url),'utf8');
const quote={ad:'Yerel Test',email:'test@example.invalid',hizmetler:['Web sitesi'],detay:'Deneme projesi',website:''};
function client({hostname='example.com',ready=true,resendEndpoint='/api/quote',send=()=>Response.json({ok:true})}={}) {
 const calls=[];
 const context={window:{},document:{getElementById:()=>({dataset:{endpoint:'https://formspree.io/f/mljjbvvb',resendEndpoint}})},location:{hostname,protocol:'https:',origin:'https://'+hostname,href:'https://'+hostname+'/teklif-formu.html'},URL,AbortController,setTimeout,clearTimeout,crypto:webcrypto,fetch:async(url,init={})=>{
  calls.push({url,init});
  if(init.method!=='POST')return Response.json({provider:'resend',ready});
  return send();
 }};
 vm.runInNewContext(source,context);
 return {delivery:context.window.quoteDelivery,calls};
}
test('readiness checks send no visitor data',async()=>{
 const {delivery,calls}=client();await delivery.ready;assert.equal(delivery.provider,'resend');assert.equal(calls.length,1);assert.equal(calls[0].init.body,undefined);assert.equal(calls[0].init.headers.Authorization,undefined);
});
test('unconfigured Resend keeps the existing Formspree submission',async()=>{
 const {delivery,calls}=client({ready:false});await delivery.send(quote);assert.equal(delivery.provider,'formspree');
 assert.equal(calls.at(-1).url,'https://formspree.io/f/mljjbvvb');assert.equal(JSON.parse(calls.at(-1).init.body).hizmetler,'Web sitesi');
});
test('GitHub Pages does not probe a nonexistent server route',async()=>{
 const {delivery,calls}=client({hostname:'temelinho.github.io'});await delivery.ready;assert.equal(calls.length,0);assert.equal(delivery.provider,'formspree');
});
test('Resend sends to the local API only and keeps its retry identifier',async()=>{
 const {delivery,calls}=client();await delivery.send(quote);await delivery.send({...quote});await delivery.send({...quote,detay:'Yeni açıklama'});
 const posts=calls.filter(c=>c.init.method==='POST');assert.ok(posts.every(c=>c.url==='https://example.com/api/quote'));
 const bodies=posts.map(c=>JSON.parse(c.init.body));assert.equal(bodies[0].submissionId,bodies[1].submissionId);assert.notEqual(bodies[0].submissionId,bodies[2].submissionId);assert.deepEqual(bodies[0].quote,quote);
 assert.ok(posts.every(c=>!c.init.headers.Authorization));
});
test('a failed Resend request never triggers a second Formspree submission',async()=>{
 const {delivery,calls}=client({send:()=>Response.json({ok:false,error:'result_unknown'},{status:504})});await assert.rejects(delivery.send(quote),/result_unknown/);assert.equal(calls.filter(c=>c.init.method==='POST').length,1);assert.ok(calls.every(c=>!c.url.includes('formspree')));
});
test('HTTP success with an invalid response cannot show success',async()=>{
 const {delivery}=client({send:()=>new Response('<html>Not an API</html>',{status:200})});await assert.rejects(delivery.send(quote),/send_failed/);
});
test('rate limits have a recognizable user-facing error',async()=>{
 const {delivery}=client({send:()=>Response.json({ok:false},{status:429})});await assert.rejects(delivery.send(quote),/rate_limited/);
});
test('the browser cannot be configured to call the secret-bearing Resend API directly',async()=>{
 const {delivery,calls}=client({resendEndpoint:'https://api.resend.com/emails'});await delivery.ready;assert.equal(calls.length,0);assert.equal(delivery.provider,'formspree');
});
