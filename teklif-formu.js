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
  const endpoint = /^https:\/\/formspree\.io\/f\/[a-zA-Z0-9]+$/.test(form.dataset.endpoint || '') ? form.dataset.endpoint : '';
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
      `Bütçe: ${state.butce}`, `Zamanlama: ${state.zaman}`, '', 'Proje detayı:', state.detay
    ].join('\n');
    document.querySelector('#quote-summary').textContent = summary;
    mailLink.href = `mailto:temeltechnology@gmail.com?subject=${encodeURIComponent('Proje teklif talebi — ' + state.ad)}&body=${encodeURIComponent(summary)}`;
    sendButton.hidden = !endpoint;
    mailLink.classList.toggle('btn-primary', !endpoint);
    mailLink.classList.toggle('btn-ghost', Boolean(endpoint));
    if (endpoint) result.querySelector('.sub').textContent = 'Henüz gönderilmedi. Özeti kontrol edin; Teklifi gönder düğmesiyle talebinizi bize iletin.';
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
    if (!endpoint || sending) return;
    sending = true;
    sendButton.disabled = editButton.disabled = true;
    sendButton.textContent = 'Gönderiliyor…';
    const error = form.querySelector('#send-error');
    error.style.display = 'none';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {'Accept': 'application/json', 'Content-Type': 'application/json'},
        body: JSON.stringify({...state, hizmetler: state.hizmetler.join(', '), _subject: 'Yeni teklif talebi — ' + state.ad}),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('submission-failed');
      result.querySelector('h2').textContent = 'Talebiniz iletildi.';
      result.querySelector('.sub').textContent = 'Teşekkürler. Projenizi inceleyip paylaştığınız iletişim bilgileriyle size dönüş yapacağız.';
      result.querySelector('.quote-actions').hidden = true;
      result.querySelector('h2').focus({preventScroll: true});
    } catch (failure) {
      error.textContent = failure.name === 'AbortError'
        ? 'Gönderim sonucu doğrulanamadı. Tekrar göndermeden önce e-posta üzerinden bizimle iletişime geçebilirsiniz.'
        : 'Gönderim tamamlanamadı. Tekrar deneyebilir veya E-postada aç bağlantısını kullanabilirsiniz.';
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
