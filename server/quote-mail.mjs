import { createHash } from 'node:crypto';

const MAX_BODY = 12_000;
const EMAIL = /^[^\s<>@,;\r\n]+@[^\s<>@,;\r\n]+\.[^\s<>@,;\r\n]+$/;
const SERVICES = new Set(['Web sitesi','Mobil uygulama','Kurumsal yazılım','E-ticaret','Entegrasyon / API','Dijital reklam (Google / Sosyal medya)','Diğer / Emin değilim']);
const BUDGETS = new Set(['< 10.000 ₺','10.000 – 30.000 ₺','30.000 – 75.000 ₺','75.000 ₺ +','Bütçem henüz belli değil']);
const TIMES = new Set(['En kısa sürede','1-3 ay içinde','Sadece fikir alıyorum']);
const TYPES = new Set(['Bireysel','Kurumsal','İşletme']);
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function settings(env) {
  const from = (env.RESEND_FROM || '').trim();
  const address = from.match(/<([^<>]+)>$/)?.[1] || from;
  const to = (env.QUOTE_TO || 'temeltechnology@gmail.com').trim();
  const origins = (env.SITE_ORIGIN || '').split(',').map(value => value.trim()).filter(value => {
    try { const url = new URL(value); return url.origin === value && (url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname))); } catch { return false; }
  });
  return {from,to,origins,ready:env.MAIL_ENABLED === 'true' && Boolean(env.RESEND_API_KEY) && EMAIL.test(address) && !/[\r\n]/.test(from) && EMAIL.test(to) && origins.length > 0};
}

function textField(value, max, min=0, multiline=false) {
  if (typeof value !== 'string') return min ? null : '';
  const clean = value.trim();
  if (clean.length < min || clean.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(clean) || (!multiline && /[\r\n]/.test(clean))) return null;
  return clean;
}

function validate(body) {
  if (!body || typeof body !== 'object' || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(body.submissionId || '')) return null;
  const input = body.quote;
  if (!input || typeof input !== 'object' || Array.isArray(input) || (input.website && String(input.website).trim())) return null;
  const quote = {
    ad:textField(input.ad,100,2), email:textField(input.email,120,3),
    telefon:textField(input.telefon,30), sirket:textField(input.sirket,100),
    musteri_tipi:input.musteri_tipi, hizmetler:input.hizmetler,
    butce:input.butce, zaman:input.zaman, detay:textField(input.detay,1500,5,true),
    hedef:textField(input.hedef,120), ornek_proje:textField(input.ornek_proje,100)
  };
  if (Object.values(quote).some(value=>value===null) || !EMAIL.test(quote.email) || !TYPES.has(quote.musteri_tipi) || !BUDGETS.has(quote.butce) || !TIMES.has(quote.zaman)) return null;
  if (!Array.isArray(quote.hizmetler) || !quote.hizmetler.length || quote.hizmetler.length > SERVICES.size || quote.hizmetler.some(value=>!SERVICES.has(value))) return null;
  quote.hizmetler = [...new Set(quote.hizmetler)];
  return {quote,submissionId:body.submissionId};
}

function emailContent(quote, config) {
  const rows = [
    ['Ad Soyad',quote.ad],['E-posta',quote.email],['Telefon',quote.telefon],['Şirket / Marka',quote.sirket],
    ['Proje türü',quote.musteri_tipi],['Hizmetler',quote.hizmetler.join(', ')],['Bütçe',quote.butce],
    ['Zamanlama',quote.zaman],['Hedef',quote.hedef],['İlgilendiği proje',quote.ornek_proje]
  ].filter(([,value])=>value);
  const text = ['Temel Technology — Yeni proje talebi','',...rows.map(([label,value])=>`${label}: ${value}`),'','Proje detayı:',quote.detay].join('\n');
  const html = `<div style="background:#f5f2fa;padding:24px;font-family:Arial,sans-serif;color:#2c2039"><div style="max-width:620px;margin:auto;background:#fff;border:1px solid #e7dfef;border-radius:18px;padding:28px"><p style="font-size:12px;color:#7444a8;letter-spacing:1px">TEMEL TECHNOLOGY</p><h1 style="font-size:26px;margin:12px 0 24px">Yeni proje talebi</h1><table role="presentation" style="width:100%;border-collapse:collapse">${rows.map(([label,value])=>`<tr><td style="padding:12px 8px 12px 0;border-bottom:1px solid #eee7f4;font-size:13px;vertical-align:top;color:#7b6b88;width:35%">${escape(label)}</td><td style="padding:12px 0;border-bottom:1px solid #eee7f4;font-size:14px;overflow-wrap:anywhere">${escape(value)}</td></tr>`).join('')}</table><h2 style="font-size:16px;margin-top:28px">Proje detayı</h2><p style="font-size:14px;line-height:1.8;overflow-wrap:anywhere">${escape(quote.detay).replace(/\r?\n/g,'<br>')}</p><p style="font-size:12px;color:#7b6b88;margin-top:28px">Bu e-postayı yanıtlayarak talep sahibine ulaşabilirsiniz.</p></div></div>`;
  return {from:config.from,to:[config.to],reply_to:quote.email,subject:`Yeni proje talebi — ${quote.ad}`,text,html};
}

async function readBody(request) {
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY) throw new Error('too_large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid_request');
  const chunks=[]; let size=0;
  try {
    while (true) {
      const {value,done}=await reader.read(); if(done)break;
      size+=value.byteLength;
      if(size>MAX_BODY){await reader.cancel();throw new Error('too_large');}
      chunks.push(value);
    }
  } finally {reader.releaseLock();}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function createQuoteHandler({fetchImpl=fetch,now=Date.now}={}) {
  // Best-effort per-instance burst protection. Also configure Vercel WAF for /api/quote.
  const attempts = new Map();
  return async function handle(request, env) {
    const config=settings(env);
    const origin=request.headers.get('origin');
    const allowed=config.origins.includes(origin);
    const headers={'Cache-Control':'no-store','Content-Type':'application/json; charset=utf-8','Vary':'Origin','X-Content-Type-Options':'nosniff'};
    if(allowed)headers['Access-Control-Allow-Origin']=origin;
    const reply=(status,body,extra={})=>new Response(JSON.stringify(body),{status,headers:{...headers,...extra}});
    if(request.method==='GET')return reply(200,{provider:'resend',ready:config.ready});
    if(request.method==='OPTIONS') {
      if(!allowed)return reply(403,{ok:false,error:'origin_denied'});
      return new Response(null,{status:204,headers:{...headers,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}});
    }
    if(request.method!=='POST')return reply(405,{ok:false,error:'method_not_allowed'},{Allow:'GET, POST, OPTIONS'});
    if(!allowed)return reply(403,{ok:false,error:'origin_denied'});
    if(!config.ready)return reply(503,{ok:false,error:'service_unavailable'});
    if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/json')return reply(415,{ok:false,error:'invalid_request'});
    let input;
    try{input=validate(await readBody(request));}catch(error){return reply(error.message==='too_large'?413:400,{ok:false,error:'invalid_request'});}
    if(!input)return reply(400,{ok:false,error:'invalid_request'});
    const time=now();
    for(const [key,item]of attempts)if(item.until<=time)attempts.delete(key);
    const ip=(request.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim().slice(0,64);
    const limit=attempts.get(ip)||{count:0,until:time+600_000};
    if(limit.count>=5 || (!attempts.has(ip)&&attempts.size>=10_000))return reply(429,{ok:false,error:'rate_limited'},{'Retry-After':String(Math.max(1,Math.ceil((limit.until-time)/1000)))});
    limit.count++;attempts.set(ip,limit);
    const mail=emailContent(input.quote,config);
    const fingerprint=createHash('sha256').update(JSON.stringify(mail)).digest('hex');
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),9_000);
    try {
      const upstream=await fetchImpl('https://api.resend.com/emails',{
        method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json','Idempotency-Key':`quote/${input.submissionId}/${fingerprint}`},
        body:JSON.stringify(mail),signal:controller.signal
      });
      if(upstream.status===429)return reply(429,{ok:false,error:'rate_limited'},{'Retry-After':'60'});
      if(!upstream.ok)return reply(upstream.status>=500?502:503,{ok:false,error:'send_failed'});
      const result=await upstream.json().catch(()=>null);
      if(typeof result?.id!=='string'||!result.id)return reply(502,{ok:false,error:'send_failed'});
      return reply(200,{ok:true});
    } catch(error) {
      return reply(error.name==='AbortError'?504:502,{ok:false,error:'result_unknown'});
    } finally {clearTimeout(timeout);}
  };
}
