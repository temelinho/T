(() => {
  'use strict';
  const intents = {
    customers: {title: 'Bulunun. Tanının. İletişime geçilsin.', description: 'Web sitesi, yerel görünürlük ve reklam çalışmalarını aynı hedefte buluşturalım. Müşteriniz sizi bulduğunda bir sonraki adımı kolayca atsın.', services: 'web,reklam', goal: 'Daha fazla müşteriye ulaşmak', links: [['Web sitesi çözümleri', 'web-tasarim.html'], ['Reklam yönetimi', 'dijital-reklam.html'], ['İlgili proje: Alanya Klima', '#islerimiz', 'klima']]},
    sales: {title: 'Ürünlerinize iyi bir dijital vitrin.', description: 'Ürünlerinizi anlaşılır biçimde sunan bir mağaza; ödeme, kargo ve sipariş süreçleri için ihtiyacınıza uygun entegrasyonlar.', services: 'eticaret', goal: 'İnternetten satış yapmak', links: [['E-ticaret ve web çözümleri', 'web-tasarim.html#kapsam'], ['Vitrin örneği: Eliva Moss', '#islerimiz', 'moss']]},
    operations: {title: 'Dağınık süreçler, tek bir sistemde.', description: 'Müşteri, sipariş ve operasyon bilgilerinizi bir araya getiren yönetim panelleri. İş akışınıza uygun otomasyonlar ve API bağlantıları.', services: 'yazilim,entegrasyon', goal: 'İş süreçlerimi otomatikleştirmek', links: [['Yazılım ihtiyacımı anlatayım', 'teklif-formu.html?services=yazilim,entegrasyon']]},
    mobile: {title: 'Markanız, müşterinizin cebinde.', description: 'iOS ve Android için ihtiyacınıza uygun bir mobil deneyim. Üyelikten bildirimlere, yönetim panelinden servis bağlantılarına kadar birlikte planlayalım.', services: 'mobil', goal: 'Mobil uygulama geliştirmek', links: [['Mobil uygulama geliştirme', 'mobil-uygulama.html']]}
  };
  const intentButtons = [...document.querySelectorAll('[data-intent]')];
  const picker = document.querySelector('.intent-picker');
  if (picker) picker.hidden = false;
  intentButtons.forEach(button => button.addEventListener('click', () => {
    const item = intents[button.dataset.intent];
    intentButtons.forEach(other => other.setAttribute('aria-pressed', String(other === button)));
    document.getElementById('intent-title').textContent = item.title;
    document.getElementById('intent-description').textContent = item.description;
    document.getElementById('intent-quote').href = `teklif-formu.html?${new URLSearchParams({services:item.services,goal:item.goal})}`;
    const links = item.links.map(([label, href, project]) => {
      const link = document.createElement('a');
      link.textContent = label + ' ↗';
      link.href = href;
      if (project) link.dataset.projectShortcut = project;
      return link;
    });
    document.getElementById('intent-links').replaceChildren(...links);
  }));

  const projects = {
    moss: {need:'Botanik sanat ve ürün koleksiyonlarını markanın doğal kimliğiyle birlikte sunmak.', work:'Ürünleri ve doğal dokuları öne çıkaran web tasarımı; koleksiyonlar arasında anlaşılır bir gezinme düzeni.', delivery:'Marka ve ürün vitrini olarak kullanılan web deneyimi.'},
    klima: {need:'Klima ve beyaz eşya hizmetlerini tanıtmak, hizmet arayan ziyaretçiyi iletişime yönlendirmek.', work:'Mobil ve masaüstü web tasarımı, hizmet içeriklerinin düzenlenmesi ve yerel görünürlüğe odaklanan sayfa yapısı.', delivery:'Hizmetleri inceleme, telefonla arama ve WhatsApp üzerinden iletişim seçenekleri.'},
    eliva: {need:'Farklı ürün dünyalarını tek bir kurumsal kimlik altında tanıtmak.', work:'Çocuk, sağlık, organik ürünler ve spor koleksiyonlarını ayıran web arayüzü ve içerik düzeni.', delivery:'Dört farklı koleksiyona giriş sunan kurumsal web vitrini.'},
    cekici: {need:'Çekici ve çilingir ihtiyacında hizmete ve iletişim bilgilerine kolay erişim sağlamak.', work:'Hizmetleri, arama ve konum paylaşımı seçeneklerini öne çıkaran web tasarımı.', delivery:'Telefon üzerinden doğrudan iletişime odaklanan hizmet sitesi.'},
    alanya: {need:'Temizlik hizmetlerini farklı dillerde incelemek isteyen ziyaretçilere sunmak.', work:'Ev ve ofis temizliği içerikleri, mobil uyumlu sayfalar ve çok dilli web deneyimi.', delivery:'Hizmet tanıtımı ve iletişim akışı. Görselde sitenin İngilizce sayfası yer alıyor.'},
    manavgat: {need:'Bölgesel temizlik hizmetlerini tanıtmak ve iletişimi kolaylaştırmak.', work:'Yerel hizmet içeriklerini düzenleyen web tasarımı ve görünürlüğe odaklanan sayfa yapısı.', delivery:'Hizmet bilgilerini ve iletişim seçeneklerini bir araya getiren web sitesi.'},
    kibris: {need:'Temizlik hizmetlerini mobil ve masaüstünde anlaşılır biçimde sunmak.', work:'Hizmetlere ve iletişime erişimi kolaylaştıran, farklı ekranlara uyarlanan web tasarımı.', delivery:'Temizlik hizmetlerini tanıtan mobil uyumlu web deneyimi.'},
    beyonder: {need:'Dijital bir marka için görsel kimliği ve deneyim yönünü sunmak.', work:'Koyu zemin, mor tonlar ve sade tipografiyle hazırlanan marka sunumu.', delivery:'Bu kart bir marka sunumudur; canlı bir web sitesinin ekran görüntüsü değildir.'}
  };
  const dialog = document.getElementById('project-dialog');
  let opener = null;
  function openProject(button) {
    const id = button.dataset.project;
    const info = projects[id];
    const card = button.closest('.work-card');
    if (!dialog || !card || !info) return;
    opener = button;
    document.getElementById('project-title').textContent = card.querySelector('h3').textContent;
    document.getElementById('project-intro').textContent = card.querySelector('.work-content > p').textContent;
    document.getElementById('project-need').textContent = info.need;
    document.getElementById('project-work').textContent = info.work;
    document.getElementById('project-delivery').textContent = info.delivery;
    const media = document.getElementById('project-image');
    const source = card.querySelector('.work-browser img');
    if (source) {
      const img = document.createElement('img');
      img.src = `images/projects/${id}-desktop.webp`;
      img.alt = source.alt;
      img.width = 1280; img.height = 860; img.decoding = 'async';
      media.className = 'dialog-image'; media.replaceChildren(img);
    } else {
      media.className = 'dialog-image work-beyonder';
      media.replaceChildren(card.querySelector('.work-media').cloneNode(true));
    }
    const live = document.getElementById('project-live');
    const site = card.querySelector('.work-link');
    live.hidden = !site;
    if (site) live.href = site.href; else live.removeAttribute('href');
    document.getElementById('project-quote').href = `teklif-formu.html?${new URLSearchParams({services:'web',project:card.querySelector('h3').textContent})}`;
    dialog.showModal();
    document.documentElement.classList.add('project-open');
    dialog.scrollTop = 0;
  }
  document.querySelectorAll('[data-project]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => openProject(button));
  });
  if (dialog) {
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    let backdropPress = false;
    dialog.addEventListener('pointerdown', event => {backdropPress = event.target === dialog && outside(event);});
    const outside = event => {
      const r = dialog.getBoundingClientRect();
      return event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom;
    };
    dialog.addEventListener('click', event => {if (backdropPress && event.target === dialog && outside(event)) dialog.close();backdropPress = false;});
    dialog.addEventListener('close', () => {
      document.documentElement.classList.remove('project-open');
      opener?.focus({preventScroll:true});
    });
  }
  document.addEventListener('click', event => {
    const shortcut = event.target.closest('[data-project-shortcut]');
    if (!shortcut) return;
    event.preventDefault();
    document.querySelector('[data-work-filter="all"]').click();
    const button = document.querySelector(`[data-project="${shortcut.dataset.projectShortcut}"]`);
    const card = button.closest('.work-card');
    const motion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('islerimiz').scrollIntoView({behavior:motion ? 'instant':'smooth',block:'start'});
    card.querySelector('.work-select').click();
    button.focus({preventScroll:true});
  });
  const initialProject = new URLSearchParams(location.search).get('proje');
  if (Object.hasOwn(projects, initialProject)) {
    const button = [...document.querySelectorAll('[data-project]')].find(item => item.dataset.project === initialProject);
    if (button) {
      button.closest('.work-card').querySelector('.work-select').click();
      openProject(button);
    }
  }
})();
