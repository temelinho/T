(() => {
  'use strict';
  const form=document.getElementById('quoteForm');
  if(!form)return;
  const fallback=/^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(form.dataset.endpoint||'') ? form.dataset.endpoint : '';
  let endpoint=fallback, provider=fallback?'formspree':'';
  let lastQuote='', submissionId='';
  // Readiness never sends contact data. GitHub Pages keeps its current working form.
  const ready=(async()=>{
    if(!form.dataset.resendEndpoint || location.hostname==='temelinho.github.io' || location.protocol==='file:')return;
    let candidate;
    try{candidate=new URL(form.dataset.resendEndpoint,location.href);if(candidate.origin!==location.origin)return;}catch{return;}
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),3000);
    try{
      const response=await fetch(candidate.href,{headers:{Accept:'application/json'},cache:'no-store',credentials:'omit',signal:controller.signal});
      const info=response.ok ? await response.json() : null;
      if(info?.provider==='resend'&&info.ready===true){endpoint=candidate.href;provider='resend';}
    }catch{/* Keep the existing submission destination until Resend is configured. */}
    finally{clearTimeout(timer);}
  })();
  window.quoteDelivery={
    ready,
    get available(){return Boolean(endpoint);},
    get provider(){return provider;},
    async send(quote,signal){
      await ready;
      if(!endpoint)throw new Error('service_unavailable');
      let body;
      if(provider==='resend'){
        const signature=JSON.stringify(quote);
        if(signature!==lastQuote){lastQuote=signature;submissionId=crypto.randomUUID();}
        body={quote,submissionId};
      }else body={...quote,hizmetler:quote.hizmetler.join(', '),_subject:'Yeni teklif talebi — '+quote.ad};
      const response=await fetch(endpoint,{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},credentials:'omit',body:JSON.stringify(body),signal});
      if(provider==='resend'){
        const result=await response.json().catch(()=>null);
        if(!response.ok || result?.ok!==true)throw new Error(response.status===429?'rate_limited':result?.error==='invalid_request'?'invalid_request':result?.error==='result_unknown'?'result_unknown':'send_failed');
      }else if(!response.ok)throw new Error('send_failed');
    }
  };
})();
