(() => {
  const visual = document.querySelector('.ecosystem');
  if (!visual) return;
  const devices = [...visual.querySelectorAll('[data-channel]')];
  const buttons = [...visual.querySelectorAll('[data-service]')];
  const order = ['web', 'app', 'instagram', 'whatsapp', 'maps'];
  const descriptions = {
    web: 'İşletmenizin dijital merkezi. Hızlı, şık ve size özel bir web sitesi.',
    app: 'Markanız müşterinizin cebinde. Size özel mobil deneyimler.',
    instagram: 'Instagram’da görünür olun, reklamlarla doğru kitleye ulaşın.',
    whatsapp: 'İlgiyi görüşmeye dönüştürün. Müşteriniz size kolayca ulaşsın.',
    maps: 'Haritada yerinizi alın. Yakınınızdaki müşteriler sizi bulsun.'
  };
  const caption = visual.querySelector('#service-description');
  const count = visual.querySelector('.ecosystem-number');
  const note = visual.querySelector('.demo-note');
  const autoplayButton = visual.querySelector('.showcase-autoplay');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let enabled = !motion.matches;
  let visible = false;
  let hovering = false;
  let timer = null;
  let resumeAt = 0;
  const INTERVAL = 4500;

  function schedule() {
    clearTimeout(timer);
    timer = null;
    if (!enabled || !visible || hovering || document.hidden) return;
    const delay = Math.max(INTERVAL, resumeAt - Date.now());
    timer = setTimeout(() => {
      select(order[(order.indexOf(current) + 1) % order.length], false);
      schedule();
    }, delay);
  }
  function updatePlayback() {
    autoplayButton.textContent = enabled ? 'Ⅱ' : '▷';
    autoplayButton.setAttribute('aria-pressed', String(enabled));
    autoplayButton.setAttribute('aria-label', enabled ? 'Otomatik geçişi duraklat' : 'Otomatik geçişi başlat');
    schedule();
  }
  let current = 'instagram';
  function select(key, manual = true) {
    const index = order.indexOf(key);
    if (index < 0) return;
    current = key;
    devices.forEach(device => {
      const own = order.indexOf(device.dataset.channel);
      const active = own === index;
      device.classList.toggle('is-active', active);
      const left = key === 'instagram' ? 'whatsapp' : order[(index + order.length - 1) % order.length];
      const right = key === 'instagram' ? 'maps' : order[(index + 1) % order.length];
      device.classList.toggle('is-left', device.dataset.channel === left);
      device.classList.toggle('is-right', device.dataset.channel === right);
      device.setAttribute('aria-hidden', String(!active));
    });
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.service === key)));
    const rail = visual.querySelector('.service-selector');
    const selected = buttons.find(button => button.dataset.service === key);
    if (rail.scrollWidth > rail.clientWidth && selected) {
      const delta = selected.getBoundingClientRect().left - rail.getBoundingClientRect().left - (rail.clientWidth - selected.offsetWidth) / 2;
      rail.scrollTo({left: rail.scrollLeft + delta, behavior: manual && !motion.matches ? 'smooth' : 'instant'});
    }
    caption.setAttribute('aria-live', manual ? 'polite' : 'off');
    caption.textContent = descriptions[key];
    note.replaceChildren();
    const sources = {
      instagram: ['https://www.instagram.com/instagram/', '@instagram · Resmî profilin gerçek ekranı ↗'],
      web: ['https://alanyaklimatemizligi.com', 'Alanya Klima Temizliği · Gerçek proje ekranı ↗'],
      app: ['https://play.google.com/store/apps/details?id=trendyol.com&hl=tr', 'Trendyol · Resmî uygulama görseli (örnek) ↗'],
      whatsapp: ['https://play.google.com/store/apps/details?id=com.whatsapp&hl=tr', 'WhatsApp · Güncel resmî mağaza ekranı ↗'],
      maps: ['https://share.google/tDwCWmuGkTOJjURBa', 'Güneş Klima · Google Haritalar işletme profili ↗']
    };
    const link = document.createElement('a');
    link.href = sources[key][0];
    link.textContent = sources[key][1];
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    note.appendChild(link);
    if (manual) {
      resumeAt = Date.now() + 9000;
      schedule();
    }
    count.textContent = `${String(index + 1).padStart(2, '0')} / 05`;
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(button.dataset.service));
    button.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].focus();
      select(buttons[next].dataset.service);
    });
  });
  const stage = visual.querySelector('.device-stage');
  let press = null;
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    press = {x: event.clientX, y: event.clientY, id: event.pointerId};
    resumeAt = Date.now() + 9000;
    schedule();
  });
  stage.addEventListener('pointerup', event => {
    if (!press || press.id !== event.pointerId) return;
    const dx = event.clientX - press.x;
    const dy = event.clientY - press.y;
    press = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
    const index = order.indexOf(current);
    select(order[(index + (dx < 0 ? 1 : -1) + order.length) % order.length]);
  });
  stage.addEventListener('pointercancel', () => { press = null; });
  stage.addEventListener('pointerleave', () => { press = null; });
  autoplayButton.addEventListener('click', () => {
    enabled = !enabled;
    resumeAt = 0;
    updatePlayback();
  });
  visual.addEventListener('pointerenter', event => {
    if (event.pointerType !== 'mouse') return;
    hovering = true;
    schedule();
  });
  visual.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse') return;
    hovering = false;
    schedule();
  });
  visual.addEventListener('focusin', () => {
    resumeAt = Date.now() + 9000;
    schedule();
  });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => {
    enabled = !motion.matches;
    updatePlayback();
  });
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  }, {threshold: 0.25});
  visibility.observe(visual);
  select(current, false);
  updatePlayback();
})();
