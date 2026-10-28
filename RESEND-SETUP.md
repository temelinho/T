# Resend + Vercel teklif formu

Site statik kalır. `api/quote.mjs` Vercel üzerinde çalışır; Resend API anahtarı yalnızca sunucu ortam değişkeninde tutulur. Yeni bir tarayıcı paketi veya e-posta SDK bağımlılığı yoktur.

## Mevcut durum

Üretimde Resend gönderici alan adı ve Vercel ortam değişkenleri bağlandı. Form sayfası `/api/quote` hazırlık kontrolünü yapar; sunucu `ready: true` döndürdüğünde Resend'i kullanır. GitHub Pages sürümü mevcut Formspree bağlantısını kullanmaya devam eder.

Resend akışında tek `/emails/batch` isteği iki ayrı mesaj oluşturur: işletmeye ayrıntılı proje talebi, ziyaretçinin doğrulanmış biçimdeki e-posta adresine tasarımlı “Talebinizi aldık” bildirimi. Bu adresin sahipliği form tarafından doğrulanmaz. Müşteri mailinde yalnızca ad, seçili hizmetler ve talep numarası bulunur; proje detayı, bütçe ve telefon kopyalanmaz. Müşteri mailini yanıtlamak `QUOTE_TO` adresine, işletme mailini yanıtlamak ziyaretçiye gider. Başarı için iki mesaj kimliği de gerekir; aynı gönderimi yeniden denemek aynı batch idempotency anahtarını kullanır. Bir teklif iki e-posta kotası tüketir. Formspree geri dönüş yolu bu sunucu şablonunu kullanmaz.

Resend ile gönderim başladıktan sonra başarısız/şüpheli bir sonuçta otomatik olarak Formspree'ye ikinci bir gönderim yapılmaz. Aynı talebin tekrar denenmesi aynı Resend idempotency anahtarını kullanır. Resend bu anahtarları 24 saat saklar. Form sayfasını yenilemek yeni bir talep oluşturur.

## Vercel kurulumu

1. Son kodu içeren `temelinho/T` deposunu içe aktarın. GitHub'a gönderme, kullanıcının ayrı talimatını bekler.
2. Framework Preset: **Other**. Depodaki `vercel.json`, `npm run build` ve `public` çıktı klasörünü tanımlar. `api/quote.mjs` sunucu fonksiyonu olarak paketlenir.
3. İlk dağıtımda `MAIL_ENABLED=false` bırakılabilir; bu durumda Formspree çalışır.
4. Vercel > Project > Settings > Environment Variables bölümüne aşağıdaki değerleri ekleyin. Değişkenleri ekledikten veya değiştirdikten sonra yeniden dağıtım gerekir.

| Değişken | Değer |
| --- | --- |
| `RESEND_API_KEY` | Resend'de oluşturulan, mümkünse doğrulanmış gönderim alanına kısıtlı gönderim anahtarı. Gizli olarak kaydedin. |
| `RESEND_FROM` | Doğrulanmış alan adınızdaki gönderici; ör. `Temel Technology <form@alanadiniz.com>` |
| `QUOTE_TO` | `temeltechnology@gmail.com` |
| `SITE_ORIGIN` | Yayınlanan sitenin tam kökeni; ör. `https://projeniz.vercel.app`. Sonunda `/` olmamalı. Birden fazlası virgülle ayrılabilir. |
| `MAIL_ENABLED` | Diğer ayarlar hazır olduğunda `true` |

API anahtarını HTML/JavaScript'e, GitHub'a, ekran görüntülerine veya sohbet mesajına koymayın. `.env*` dosyaları Git dışında tutulur; `.env.example` yalnızca boş şablondur. Build yalnızca açıkça seçilmiş site dosyalarını ve kullandıkları görselleri kopyalar; sunucu dosyaları, testler, belgeler ve gizli ayarlar statik çıktıya girmez.

## Resend alan adı

Resend > Domains bölümünden size ait alan adını ekleyip verilen DNS kayıtlarıyla doğrulayın. Gmail adresi `from` olarak doğrulanamaz; mevcut Gmail adresiniz alıcı olarak kalabilir.

Alan adınız hazır değilse `onboarding@resend.dev` yalnızca test içindir ve Resend hesabınızla ilişkili e-posta adresine gönderim yapabilir. Bu, genel kullanıma açık üretim göndericisi yerine geçmez.

## İstek korumaları

Sunucu yalnızca izin verilen kökenden JSON POST kabul eder; alanlar ve gövde boyutu doğrulanır. Alıcı/gönderici tarayıcı verisinden alınmaz. Gizli bot alanı ve sunucu örneği başına IP bazlı kısa süreli limit bulunur. Bu bellek içi limit farklı sunucu örnekleri arasında paylaşılmaz ve yeniden başlatmada sıfırlanır.

Yayına alırken Vercel > Firewall altında `/api/quote` POST istekleri için IP başına örneğin 60 saniyede 5 istek sınırı ekleyin. Dağıtık trafik için asıl sınırı platformda uygulayın; seçilen planın kullanım ve fiyat bilgisini kontrol edin. Anahtarı yalnızca gönderim yetkisiyle sınırlandırın.

## Kontroller

`npm test`: Resend'e gerçek istek atmadan doğrulama, sabit alıcı, HTML kaçışları, CORS, idempotency, limit ve hata senaryolarını çalıştırır.

`npm run build`: Vercel için statik site çıktısını hazırlar. `public` üretilen klasördür; kaynak düzenlemelerini kök dosyalarda yapın.

`GET /api/quote` yalnızca hazırlık durumunu gösterir; anahtarı veya e-posta içeriğini döndürmez. Gönderim başarısı yalnızca Resend başarılı durum ve mesaj kimliği döndürürse kabul edilir. Bu, gelen kutusuna nihai teslim garantisi değildir. Gerçek teslim testi ayrıca kullanıcı tarafından başlatılmalıdır.

## Resmî kaynaklar

- [Resend gönderim API'si](https://resend.com/docs/api-reference/emails/send-email)
- [İki ayrı mesajı birlikte gönderme](https://resend.com/docs/api-reference/emails/send-batch-emails)
- [Alan adı doğrulama](https://resend.com/docs/dashboard/domains/introduction)
- [resend.dev test kısıtları](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain)
- [Yinelenen gönderimleri önleme](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Vercel Node.js fonksiyonları](https://vercel.com/docs/functions/runtimes/node-js)
- [Vercel WAF istek sınırı](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting)
- [Vercel Hobby: kişisel ve ticari olmayan kullanım](https://vercel.com/docs/plans/hobby)
