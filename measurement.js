(() => {
  'use strict';
  const id = window.temelMeasurementConfig?.measurementId || '';
  const configured = /^G-[A-Z0-9]+$/.test(id);
  const key = 'tt_measurement_consent';
  let enabled = false, loaded = false;
  try { enabled = configured && localStorage.getItem(key) === 'granted'; } catch (_) { /* Optional storage. */ }
  function start() {
    if (!enabled || loaded || !configured) return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js',new Date());
    // Never collect form values, search terms, query strings or contact details.
    window.gtag('config',id,{send_page_view:false,page_location:document.querySelector('link[rel="canonical"]').href,page_referrer:'',allow_google_signals:false,allow_ad_personalization_signals:false});
    const script = document.createElement('script'); script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
    document.head.append(script);
    track('page_view');
  }
  function track(name, extra = {}) {
    if (!enabled || !configured || !loaded) return;
    const allowed = ['page_view','generate_lead','contact_click'];
    if (!allowed.includes(name)) return;
    const page = document.querySelector('link[rel="canonical"]')?.href || location.origin + location.pathname;
    const details = {page_location:page,page_referrer:'',language:document.documentElement.lang};
    if (['phone','whatsapp','email'].includes(extra.contact_method)) details.contact_method = extra.contact_method;
    window.gtag('event',name,details);
  }
  window.temelMeasurement = {track};
  document.addEventListener('click',event => {
    const a = event.target.closest('a[href]'); if (!a) return;
    const url = new URL(a.href,location.href);
    const method = url.protocol === 'tel:' ? 'phone' : url.protocol === 'mailto:' ? 'email' : url.hostname === 'wa.me' ? 'whatsapp' : '';
    if (method) track('contact_click',{contact_method:method});
  });
  document.addEventListener('languagechange',() => track('page_view'));
  const dialog = document.getElementById('measurement-dialog');
  if (dialog) {
    const t = text => window.siteI18n.t(text);
    const status = document.getElementById('measurement-status');
    status.setAttribute('data-no-translate','');
    function render() {
      status.textContent = t(!configured ? 'İsteğe bağlı ziyaret ölçümü şu anda etkin değil.' : enabled ? 'İsteğe bağlı ziyaret ölçümü açık.' : 'İsteğe bağlı ziyaret ölçümü kapalı.');
      document.getElementById('measurement-allow').hidden = !configured;
    }
    document.querySelector('[data-measurement-open]').addEventListener('click',()=>{render();dialog.showModal();});
    document.getElementById('measurement-allow').addEventListener('click',()=>{
      enabled = configured;
      try {localStorage.setItem(key,'granted');} catch (_) { /* Session-only preference. */ }
      if (loaded) window.gtag('consent','update',{analytics_storage:'granted'});
      start(); render();
    });
    document.getElementById('measurement-deny').addEventListener('click',()=>{
      enabled = false;
      try {localStorage.setItem(key,'denied');} catch (_) { /* Keep disabled. */ }
      if (loaded) window.gtag('consent','update',{analytics_storage:'denied'});
      // Clear first-party GA cookies when withdrawing consent.
      document.cookie.split(';').forEach(cookie=>{
        const name = cookie.trim().split('=')[0];
        if (!/^_ga(?:_|$)/.test(name)) return;
        for (const domain of ['',location.hostname,'.'+location.hostname]) document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax` + (domain ? '; Domain='+domain : '');
      });
      render();
    });
    document.getElementById('measurement-close').addEventListener('click',()=>dialog.close());
    document.addEventListener('languagechange',render);
    render();
    if (configured) {
      let chosen = false; try {chosen = Boolean(localStorage.getItem(key));} catch (_) { /* Ask for this visit. */ }
      if (!chosen) {
        const banner = document.getElementById('measurement-banner'); banner.hidden = false;
        banner.querySelector('button').addEventListener('click',()=>{banner.hidden = true;render();dialog.showModal();});
      }
    }
  }
  start();
})();
