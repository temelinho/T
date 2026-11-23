# Talep takibi

`talep-takip-sablonu.csv` dosyasını Excel veya kullandığınız tablo uygulamasında açın. Bu dosya bir ekip içi takip şablonudur; web sitesinde yayımlanmaz ve formdan otomatik veri aktarmaz. Doldurduğunuz kopyayı bu Git deposunun dışında saklayın.

Her yeni e-posta talebinde bir satır açın. Mailde referans varsa onu, yoksa ekip içinde atadığınız bir talep numarasını kullanın. Ad, telefon ve proje metnini tekrar kopyalamak yerine ilgili e-postaya yerel bir referans tutmanız yeterlidir.

- Durum: Yeni / Görüşüldü / Teklif gönderildi / Kazanıldı / Kaybedildi / Test.
- Kaynak: ziyaretçi veya kampanya kaydından biliniyorsa Google organik / Google reklam / Sosyal medya / Referans / Doğrudan. Bilinmiyorsa Bilinmiyor yazın. GA4 toplamlarından tek bir kişinin kaynağını tahmin etmeyin.
- Sorumlu ve takip tarihi: ilk dönüşü yapacak kişiyi ve sonraki kontrol tarihini girin.
- Teklif ve sonuç: gerçek teklif tarihi, teklif tutarı ve kazanılma/kaybedilme tarihini işleyin. Kaybedilen taleplerde kısa bir neden kaydedin.
- Haftalık kontrol: yeni gerçek talep, teklif gönderilen ve kazanılan sayısını ayrı sayın. Test kayıtlarını sonuçlara katmayın. Dönüş süresini talep tarihi ile ilk dönüş tarihi arasında ölçün.

TT-GA4-20261123 teknik testi gerçek müşteri değildir. GA4'te oluşturduğu 1 `generate_lead` dönüşümünü gerçek talep artışı gibi değerlendirmeyin.

Bu şablon satış takibidir. Analytics yalnızca izin veren ziyaretçilerin site davranışlarını toplu ölçer; teklifin işe dönüşmesini ekip bu dosyada günceller.
