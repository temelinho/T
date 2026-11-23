import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../measurement.js',import.meta.url),'utf8');
function setup(id,consent) {
  const scripts=[],calls=[],listeners={};
  const context={
    window:{temelMeasurementConfig:{measurementId:id},gtag:(...args)=>calls.push(args)},
    localStorage:{getItem:()=>consent},
    location:{origin:'https://temeltechnology.com',pathname:'/teklif-formu.html',href:'https://temeltechnology.com/teklif-formu.html?email=private@example.com'},
    URL,Event,
    document:{referrer:'https://www.google.com/search?q=private@example.com',documentElement:{lang:'tr'},head:{append:script=>scripts.push(script)},
      querySelector:selector=>selector.includes('canonical')?{href:'https://temeltechnology.com/teklif-formu.html'}:null,
      getElementById:()=>null,addEventListener:(name,callback)=>{listeners[name]=callback;},dispatchEvent:event=>listeners[event.type]?.(event),createElement:()=>({})}
  };
  vm.runInNewContext(source,context);
  return {context,scripts,calls,listeners};
}
test('measurement loads no provider and sends no events without an ID and explicit consent',()=>{
  for(const [id,consent] of [['','granted'],['invalid','granted'],['G-TEST123',null],['G-TEST123','denied']]){
    const {context,scripts,calls}=setup(id,consent);
    context.window.temelMeasurement.track('generate_lead');
    assert.equal(scripts.length,0);assert.equal(calls.length,0);
  }
});
test('consented measurement sends clean page URLs and allowlisted events without contact values',()=>{
  const {context,scripts,calls}=setup('G-TEST123','granted');
  assert.equal(scripts.length,1);
  const track=context.window.temelMeasurement.track;
  track('generate_lead',{email:'private@example.com',name:'Private person',phone:'12345'});
  track('contact_click',{contact_method:'whatsapp',message:'Private message'});
  track('unapproved_event',{email:'private@example.com'});
  const events=calls.filter(call=>call[0]==='event');
  assert.deepEqual(events.map(call=>call[1]),['page_view','generate_lead','contact_click']);
  assert.ok(!JSON.stringify(calls).includes('private@example.com'));
  assert.ok(!JSON.stringify(calls).includes('Private'));
  assert.ok(!JSON.stringify(calls).includes('?email='));
  assert.equal(events[2][2].contact_method,'whatsapp');
  assert.equal(events[0][2].page_referrer,'https://www.google.com/');
});
test('initial language rendering does not count the same page twice',()=>{
  const {context,calls,listeners}=setup('G-TEST123','granted');
  listeners.languagechange();
  assert.equal(calls.filter(call=>call[0]==='event'&&call[1]==='page_view').length,1);
  context.document.querySelector=()=>({href:'https://temeltechnology.com/en/teklif-formu.html'});
  context.document.documentElement.lang='en';
  listeners.languagechange();
  assert.equal(calls.filter(call=>call[0]==='event'&&call[1]==='page_view').length,2);
});
test('form funnel counts a start and each viewed step once, with allowlisted parameters only',()=>{
  const {context,calls}=setup('G-TEST123','granted');
  const measurement=context.window.temelMeasurement;
  measurement.quoteProgress(1);
  measurement.quoteProgress(1,true);
  measurement.quoteProgress(2,true);
  measurement.quoteProgress(1,true);
  measurement.quoteProgress(2,true);
  measurement.quoteProgress(0,true);
  measurement.quoteProgress('private@example.com',true);
  measurement.track('form_error',{form_step:5,error_type:'delivery_failed',email:'private@example.com'});
  measurement.track('form_error',{form_step:99,error_type:'private@example.com'});
  const events=calls.filter(call=>call[0]==='event');
  assert.equal(events.filter(call=>call[1]==='form_start').length,1);
  assert.deepEqual(events.filter(call=>call[1]==='form_step_view').map(call=>call[2].form_step),[1,2]);
  assert.equal(events.find(call=>call[1]==='form_start')[2].form_name,'project_enquiry');
  const errors=events.filter(call=>call[1]==='form_error');
  assert.equal(errors[0][2].error_type,'delivery_failed');
  assert.equal(errors[1][2].error_type,undefined);
  assert.equal(errors[1][2].form_step,undefined);
  assert.ok(!JSON.stringify(calls).includes('private@example.com'));
});
test('form interactions without consent never send funnel events',()=>{
  const {context,calls,scripts}=setup('G-TEST123','denied');
  context.window.temelMeasurement.quoteProgress(1,true);
  context.window.temelMeasurement.track('form_submit_attempt',{form_step:5});
  assert.equal(calls.length,0);
  assert.equal(scripts.length,0);
});
