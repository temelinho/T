import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import validation from '../contact-validation.js';
const source=fs.readFileSync(new URL('../teklif-formu.js',import.meta.url),'utf8');
function node(extra={}) {
  const handlers={};
  const classes=new Set();
  return {style:{},dataset:{},value:'',textContent:'',hidden:false,disabled:false,handlers,
    classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle(x,on){const selected=on??!classes.has(x);selected?classes.add(x):classes.delete(x);return selected;},contains:x=>classes.has(x)},
    addEventListener:(name,fn)=>handlers[name]=fn,setAttribute(){},getAttribute(){return null;},focus(){},
    querySelector:()=>node(),querySelectorAll:()=>[],...extra};
}
function formHarness({failure=false}={}) {
  const events=[],steps=Array.from({length:5},()=>node());
  const fields=Object.fromEntries(['ad','email','telefon','sirket','detay','website'].map(name=>[name,node({name})]));
  const elements={'#prevBtn':node(),'#nextBtn':node(),'#nav':node(),'.success':node(),'#mailto-send':node(),'#send-error':node(),'#send-fallback':node()};
  const groups=[['musteri_tipi','Kurumsal'],['hizmetler','Kurumsal yazılım'],['butce','Bütçem henüz belli değil'],['zaman','Sadece fikir alıyorum']].map(([key,value])=>{
    const option=node({dataset:{value}});
    const group=node({dataset:key==='hizmetler'?{multi:key}:{single:key},querySelectorAll:selector=>selector==='.sel'?(option.classList.contains('sel')?[option]:[]):[option]});
    option.click=()=>option.handlers.click({isTrusted:false});return {group,option};
  });
  const form=node({elements:fields,querySelector:selector=>elements[selector]||fields[selector.slice(1)]||null,
    querySelectorAll:selector=>selector==='.step'?steps:selector==='.opts'?groups.map(x=>x.group):selector==='input,textarea'?Object.values(fields):[]});
  const docHandlers={},summary=node(),progress=node(),bar=node();
  let sends=0;
  const context={window:{siteI18n:{t:x=>x},contactValidation:validation,
    temelMeasurement:{track:(name,data)=>events.push({name,...data}),quoteProgress:(step,interacted)=>events.push({name:'progress',step,interacted})},
    quoteDelivery:{ready:Promise.resolve(),available:true,provider:'resend',send:async()=>{sends++;if(failure)throw new Error('rate_limited');}}},
    document:{querySelector:selector=>selector==='#quoteForm'?form:selector==='.progress'?progress:selector==='#bar'?bar:selector==='#quote-summary'?summary:null,
      getElementById:id=>id==='prefill-note'?null:node(),addEventListener:(type,fn)=>docHandlers[type]=fn},
    location:{search:''},URLSearchParams,AbortController,setTimeout,clearTimeout};
  vm.runInNewContext(source,context);
  const submit=async()=>{form.handlers.submit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));};
  return {events,fields,elements,groups,docHandlers,context,submit,get sends(){return sends;},recover(){failure=false;}};
}
async function reachContact(h) {
  h.groups[0].option.handlers.click({isTrusted:true});await h.submit();
  h.groups[1].option.handlers.click({isTrusted:true});await h.submit();
  h.groups[2].option.handlers.click({isTrusted:true});h.groups[3].option.handlers.click({isTrusted:true});await h.submit();
  await h.submit();
}
function fillContact(h) {h.fields.ad.value='Private Name';h.fields.email.value='private@example.com';h.fields.telefon.value='05321234567';}
test('form distinguishes validation, delivery failure, retry and one successful lead',async()=>{
  const h=formHarness({failure:true});
  await h.submit();
  assert.ok(h.events.some(e=>e.name==='form_error'&&e.form_step===1&&e.error_type==='validation'));
  assert.equal(h.sends,0);
  await reachContact(h);
  fillContact(h);await h.submit();
  assert.equal(h.sends,1);
  assert.ok(h.events.some(e=>e.name==='form_error'&&e.error_type==='rate_limited'));
  assert.equal(h.events.filter(e=>e.name==='generate_lead').length,0);
  h.recover();await h.submit();await h.submit();
  assert.equal(h.sends,2);
  assert.equal(h.events.filter(e=>e.name==='generate_lead').length,1);
  assert.equal(h.events.filter(e=>e.name==='form_submit_attempt').length,2);
  assert.equal(h.elements['.success'].style.display,'block');
  assert.ok(!JSON.stringify(h.events).includes('private@example.com'));
  assert.ok(!JSON.stringify(h.events).includes('Private Name'));
});
test('late measurement consent reports only the current step and back navigation works',async()=>{
  const h=formHarness();await reachContact(h);
  h.events.length=0;
  h.docHandlers.measurementready();
  assert.deepEqual(h.events,[{name:'progress',step:5,interacted:true}]);
  h.elements['#prevBtn'].handlers.click();
  assert.deepEqual(h.events.at(-1),{name:'progress',step:4,interacted:true});
});
