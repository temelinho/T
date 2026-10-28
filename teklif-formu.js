(() => {
  'use strict';
  const form = document.querySelector('#quoteForm');
  if (!form) return;
  const state = {musteri_tipi: '', hizmetler: [], butce: '', zaman: ''};
  const steps = [...form.querySelectorAll('.step')];
  const prev = form.querySelector('#prevBtn');
  const next = form.querySelector('#nextBtn');
  const nav = form.querySelector('#nav');
  const result = form.querySelector('.success');
  const progress = document.querySelector('.progress');
  const sendButton = form.querySelector('#email-send');
  const editButton = form.querySelector('#edit-quote');
  const mailLink = form.querySelector('#mailto-send');
  const delivery = window.quoteDelivery;
  let sending = false;
  let step = 1;

  function clearErrors() {
    form.querySelectorAll('.err').forEach(error => { error.style.display = 'none'; });
  }

  form.querySelectorAll('.opts').forEach(group => {
    const multi = Boolean(group.dataset.multi);
    const key = group.dataset.multi || group.dataset.single;
    group.querySelectorAll('.opt').forEach(option => {
      option.addEventListener('click', () => {
        if (!multi) group.querySelectorAll('.opt').forEach(other => {
          other.classList.remove('sel');
          other.setAttribute('aria-pressed', 'false');
        });
        const selected = multi ? option.classList.toggle('sel') : (option.classList.add('sel'), true);
        option.setAttribute('aria-pressed', String(selected));
        state[key] = multi ? [...group.querySelectorAll('.sel')].map(item => item.dataset.value) : option.dataset.value;
        clearErrors();
      });
      option.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        option.click();
      });
    });
  });
  // Accept only known service identifiers; incoming text is never inserted as HTML.
  const serviceNames = {
    web: 'Web sitesi', mobil: 'Mobil uygulama', yazilim: 'Kurumsal yazılım',
    eticaret: 'E-ticaret', entegrasyon: 'Entegrasyon / API',
    reklam: 'Dijital reklam (Google / Sosyal medya)'
  };
  const params = new URLSearchParams(location.search);
  const requested = [...new Set((params.get('services') || '').split(',').filter(key => Object.hasOwn(serviceNames, key)).map(key => serviceNames[key]))];
  const allowedGoals = ['Daha fazla müşteriye ulaşmak', 'İnternetten satış yapmak', 'İş süreçlerimi otomatikleştirmek', 'Mobil uygulama geliştirmek'];
  const allowedProjects = ['Eliva Moss', 'Alanya Klima Temizliği', 'Eliva Digital', 'Alanya Çekici & Çilingir', 'Alanya Ev Temizlik', 'Manavgat Ev Temizlik', 'Kıbrıs Ev Temizlik', 'Beyonder'];
  if (allowedGoals.includes(params.get('goal'))) state.hedef = params.get('goal');
  if (allowedProjects.includes(params.get('project'))) state.ornek_proje = params.get('project');
  requested.forEach(name => {
    const option = [...form.querySelectorAll('[data-multi="hizmetler"] .opt')].find(item => item.dataset.value === name);
    option?.click();
  });
  const note = document.getElementById('prefill-note');
  if (note && requested.length) {
    note.hidden = false;
    note.textContent = `Başlangıç için önerilen hizmetler: ${requested.join(', ')}. Seçimleri 2. adımda değiştirebilirsiniz.` + (state.ornek_proje ? ` İlham aldığınız proje: ${state.ornek_proje}.` : '');
  }
  form.addEventListener('input', clearErrors);

  function readFields() {
    form.querySelectorAll('input,textarea').forEach(field => { state[field.name] = field.value.trim(); });
  }

  function valid() {
    if (step === 1) return Boolean(state.musteri_tipi);
    if (step === 2) return state.hizmetler.length > 0;
    if (step === 3) return Boolean(state.butce && state.zaman);
    if (step === 4) return state.detay.length >= 5;
    return state.ad.length >= 2 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.email);
  }

  function render(focus = true) {
    clearErrors();
    steps.forEach((element, index) => element.classList.toggle('active', index + 1 === step));
    document.querySelector('#bar').style.width = `${step / steps.length * 100}%`;
    progress.setAttribute('aria-valuenow', String(step));
    prev.style.visibility = step > 1 ? 'visible' : 'hidden';
    next.textContent = step === steps.length ? 'Özeti hazırla →' : 'Devam →';
    if (focus) steps[step - 1].querySelector('h2').focus({preventScroll: true});
  }

  function prepareQuote() {
    const summary = [
      'Merhaba, projem için teklif almak istiyorum.', '',
      `Ad Soyad: ${state.ad}`, `E-posta: ${state.email}`,
      ...(state.telefon ? [`Telefon: ${state.telefon}`] : []),
      ...(state.sirket ? [`Şirket / Marka: ${state.sirket}`] : []),
      `Proje türü: ${state.musteri_tipi}`, `Hizmetler: ${state.hizmetler.join(', ')}`,
      ...(state.hedef ? [`Hedef: ${state.hedef}`] : []),
      ...(state.ornek_proje ? [`İlgilendiğim proje: ${state.ornek_proje}`] : []),
      `Bütçe: ${state.butce}`, `Zamanlama: ${state.zaman}`, '', 'Proje detayı:', state.detay
    ].join('\n');
    document.querySelector('#quote-summary').textContent = summary;
    mailLink.href = `mailto:temeltechnology@gmail.com?subject=${encodeURIComponent('Proje teklif talebi — ' + state.ad)}&body=${encodeURIComponent(summary)}`;
    const updateDelivery = () => {
      if (sending) return;
      const available = Boolean(delivery?.available);
      sendButton.hidden = !available;
      mailLink.classList.toggle('btn-primary', !available);
      mailLink.classList.toggle('btn-ghost', available);
      result.querySelector('.sub').textContent = available
        ? 'Henüz gönderilmedi. Özeti kontrol edin; Teklifi gönder düğmesiyle talebinizi bize iletin.'
        : 'Henüz gönderilmedi. Özeti e-posta uygulamanızda açıp bize gönderebilirsiniz.';
    };
    updateDelivery();
    delivery?.ready.then(updateDelivery);
    steps.forEach(element => element.classList.remove('active'));
    nav.style.display = 'none';
    result.style.display = 'block';
    result.querySelector('h2').focus({preventScroll: true});
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    readFields();
    if (!valid()) {
      steps[step - 1].querySelector('.err').style.display = 'block';
      return;
    }
    if (step < steps.length) { step++; render(); } else prepareQuote();
  });
  prev.addEventListener('click', () => { if (step > 1) { step--; render(); } });
  editButton.addEventListener('click', () => {
    result.style.display = 'none';
    nav.style.display = '';
    render();
  });
  sendButton.addEventListener('click', async () => {
    if (!delivery?.available || sending) return;
    sending = true;
    sendButton.disabled = editButton.disabled = true;
    sendButton.textContent = 'Gönderiliyor…';
    const error = form.querySelector('#send-error');
    error.style.display = 'none';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      await delivery.send({...state}, controller.signal);
      result.querySelector('h2').textContent = 'Talebiniz iletildi.';
      result.querySelector('.sub').textContent = 'Teşekkürler. Projenizi inceleyip paylaştığınız iletişim bilgileriyle size dönüş yapacağız.';
      result.querySelector('.quote-actions').hidden = true;
      result.querySelector('h2').focus({preventScroll: true});
    } catch (failure) {
      if (failure.message === 'rate_limited') error.textContent = 'Kısa sürede çok sayıda deneme yapıldı. Birkaç dakika sonra tekrar deneyebilir veya e-posta üzerinden bize ulaşabilirsiniz.';
      else if (failure.message === 'invalid_request') error.textContent = 'Bilgilerinizi kontrol edip tekrar deneyin. Bilgileri düzenle düğmesiyle formunuza dönebilirsiniz.';
      else if (failure.name === 'AbortError' || failure.message === 'result_unknown') error.textContent = delivery.provider === 'resend'
        ? 'Gönderim sonucu doğrulanamadı. Aynı talebi tekrar deneyebilirsiniz; yinelenen gönderim kontrol edilir.'
        : 'Gönderim sonucu doğrulanamadı. Tekrar göndermeden önce e-posta üzerinden bizimle iletişime geçebilirsiniz.';
      else error.textContent = 'Gönderim tamamlanamadı. Tekrar deneyebilir veya E-postada aç bağlantısını kullanabilirsiniz.';
      error.style.display = 'block';
      sendButton.disabled = editButton.disabled = false;
      sendButton.textContent = 'Tekrar dene →';
    } finally {
      clearTimeout(timeout);
      sending = false;
    }
  });
  render(false);
})();
