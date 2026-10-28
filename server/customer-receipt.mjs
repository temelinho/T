const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function customerReceipt(quote, config, submissionId) {
  const name = escape(quote.ad);
  const reference = submissionId.slice(0,8).toUpperCase();
  const services = quote.hizmetler.map(escape).join(' · ');
  const text = `Temel Technology\n\nMerhaba ${quote.ad},\n\nTalebinizi aldık. Projenize gösterdiğiniz özen için teşekkür ederiz. İhtiyacınızı inceleyip paylaştığınız iletişim bilgileri üzerinden size en kısa sürede dönüş yapacağız.\n\nİlgilendiğiniz hizmetler: ${quote.hizmetler.join(', ')}\nTalep numarası: ${reference}\n\nEklemek istediğiniz bir detay varsa bu e-postayı yanıtlayabilirsiniz.\n\nWeb: https://temeltechnology.com/\nE-posta: ${config.to}\nTelefon: 0506 692 20 04\n\nBu otomatik bilgilendirme, temeltechnology.com üzerinden gönderilen teklif talebiniz için hazırlanmıştır. Fiyat veya teslim tarihi onayı değildir.`;
  const html = `<!doctype html>
<html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Talebinizi aldık — Temel Technology</title>
<style>body{margin:0;padding:0}table{border-collapse:collapse}a{color:#7142d6} @media(max-width:480px){.outer{padding:16px 8px!important}.content{padding:32px 24px!important}.brand{padding:28px 24px!important}.title{font-size:34px!important;line-height:1.12!important}.footer{padding:24px!important}}</style></head>
<body style="margin:0;background:#f4f2f8;color:#211a32;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
<div style="display:none;font-size:1px;line-height:1px;color:#f4f2f8;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">Talebiniz bize ulaştı. Projenizi inceleyip en kısa sürede size dönüş yapacağız.</div>
<table role="presentation" width="100%" style="background:#f4f2f8"><tr><td class="outer" align="center" style="padding:40px 16px">
<table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border:1px solid #e7e1f0;border-radius:24px;overflow:hidden">
<tr><td class="brand" style="padding:36px 40px;background:#191126;background-image:linear-gradient(125deg,#191126 0%,#34204e 65%,#64409a 100%);border-radius:24px 24px 0 0">
<a href="https://temeltechnology.com/" style="text-decoration:none;color:#ffffff"><span style="font-size:32px;font-weight:750;letter-spacing:-1.5px;line-height:1">temel<span style="color:#c8a8ff">.</span></span><br><span style="display:inline-block;margin-top:8px;font-size:10px;letter-spacing:3px;color:#ddd0ed">TECHNOLOGY</span></a>
<p style="margin:28px 0 0;font-size:12px;line-height:1.6;color:#e0d3ef;letter-spacing:.5px">Yazılım. Tasarım. Dijital reklam.</p></td></tr>
<tr><td class="content" style="padding:40px">
<p style="margin:0 0 22px;font-size:11px;font-weight:700;letter-spacing:1.8px;color:#7142b6">BİR FİKİRLE BAŞLAR.</p>
<h1 class="title" style="margin:0 0 24px;font-size:42px;line-height:1.08;letter-spacing:-1.7px;font-weight:750;color:#211a32">Talebinizi<br>aldık<span style="color:#8955df">.</span></h1>
<p style="margin:0 0 12px;font-size:16px;line-height:1.8;color:#211a32;overflow-wrap:anywhere">Merhaba ${name},</p>
<p style="margin:0 0 28px;font-size:15px;line-height:1.85;color:#655a73">Projenizi bizimle paylaştığınız için teşekkür ederiz. İhtiyacınızı inceleyip paylaştığınız iletişim bilgileri üzerinden <strong style="color:#352744;font-weight:600">size en kısa sürede dönüş yapacağız.</strong></p>
<table role="presentation" width="100%" style="background:#f7f4fc;border:1px solid #ece5f5;border-radius:14px"><tr><td style="padding:22px 24px">
<p style="margin:0 0 10px;font-size:10px;letter-spacing:1.5px;font-weight:700;color:#80708f">İLGİLENDİĞİNİZ HİZMETLER</p>
<p style="margin:0;font-size:14px;line-height:1.8;color:#39274e">${services}</p>
<p style="margin:18px 0 0;padding-top:14px;border-top:1px solid #e6deef;font-size:11px;color:#80708f">Talep numarası <strong style="color:#5f4777;letter-spacing:1px">${reference}</strong></p>
</td></tr></table>
<h2 style="margin:30px 0 12px;font-size:16px;letter-spacing:-.3px;color:#211a32">Sıradaki adım, birlikte netleştirmek.</h2>
<p style="margin:0 0 26px;font-size:14px;line-height:1.85;color:#655a73">Hedefinizi ve kapsamı konuşalım; projenize uygun çözümü, süreyi ve teklifi birlikte belirleyelim. Eklemek istediğiniz bir detay varsa bu e-postayı yanıtlamanız yeterli.</p>
<table role="presentation"><tr><td bgcolor="#7444cc" style="border-radius:10px;background:#7444cc"><a href="https://temeltechnology.com/#islerimiz" style="display:inline-block;padding:15px 22px;border:1px solid #7444cc;border-radius:10px;color:#ffffff;text-decoration:none;font-size:13px;font-weight:600">İşlerimize göz atın &nbsp; ↗</a></td></tr></table>
</td></tr>
<tr><td class="footer" style="padding:26px 40px 30px;border-top:1px solid #eee8f4;background:#fcfbfe;border-radius:0 0 24px 24px">
<p style="margin:0 0 10px;font-size:13px;font-weight:650;color:#3c2b50">Fikrinizin bir sonraki adımında görüşmek üzere.</p>
<p style="margin:0 0 18px;font-size:12px;line-height:2;color:#7b6d88"><a href="mailto:${escape(config.to)}" style="color:#7142b6;text-decoration:none">${escape(config.to)}</a><br><a href="tel:+905066922004" style="color:#7142b6;text-decoration:none">0506 692 20 04</a> &nbsp;·&nbsp; <a href="https://temeltechnology.com/" style="color:#7142b6;text-decoration:none">temeltechnology.com</a></p>
<p style="margin:0;font-size:10px;line-height:1.8;color:#92859e">Bu otomatik bilgilendirme, web sitemizden gönderilen teklif talebiniz için hazırlanmıştır. Fiyat veya teslim tarihi onayı değildir.</p>
</td></tr></table></td></tr></table></body></html>`;
  return {from:config.from,to:[quote.email],reply_to:config.to,subject:'Talebinizi aldık — Temel Technology',text,html};
}
