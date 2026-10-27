// PORTFOLIO DATA
  const PORTFOLIO_DATA = [
    {
      title: 'Alanya Ev Temizlik',
      category: 'Web Sitesi',
      catKey: 'web',
      desc: 'Ev ve ofis temizlik hizmetleri için SEO odaklı, mobil uyumlu tanıtım ve rezervasyon sitesi.',
      url: 'https://alanyaevtemizlik.com.tr',
      image: 'images/alanyaevtemizlik-cover.webp'
    },
    {
      title: 'Alanya Çekici & Çilingir',
      category: 'Web Sitesi',
      catKey: 'web',
      desc: '7/24 acil çekici ve çilingir hizmetleri için hızlı erişimli yerel hizmet sitesi.',
      url: 'https://alanyacekicicilingir.com.tr',
      image: 'images/alanyacekicicilingir-cover.webp'
    },
    {
      title: 'Manavgat Ev Temizlik',
      category: 'Web Sitesi',
      catKey: 'web',
      desc: 'Yerel SEO ile bölgesel temizlik hizmetlerini öne çıkaran tanıtım sitesi.',
      url: 'https://manavgatevtemizlik.com.tr',
      image: 'images/manavgatevtemizlik-cover.webp'
    },
    {
      title: 'Kıbrıs Ev Temizlik',
      category: 'Web Sitesi',
      catKey: 'web',
      desc: 'Kıbrıs bölgesi için hizmet tanıtımı ve iletişim odaklı kurumsal site.',
      url: 'https://kıbrısevtemizlik.com.tr',
      image: 'images/kibrisevtemizlik-cover.webp'
    },
    {
      title: 'Alanya Klima Temizliği',
      category: 'Web Sitesi',
      catKey: 'web',
      desc: 'Klima bakım ve temizlik hizmetleri için dönüşüm odaklı yerel web sitesi.',
      url: 'https://alanyaklimatemizligi.com',
      image: 'images/alanyaklimatemizligi-cover.webp'
    },
    {
      title: 'Eliva Digital',
      category: 'Kurumsal / Ajans',
      catKey: 'kurumsal',
      desc: 'Dijital ajans için kurumsal tanıtım sitesi ve hizmet vitrini.',
      url: 'https://elivadigital.com.tr',
      image: 'images/elivadigital-cover.webp'
    },
    {
      title: 'Eliva Moss',
      category: 'Biyofilik Tasarım & Kurumsal',
      catKey: 'kurumsal',
      desc: 'Bakım gerektirmeyen stabilize yosun duvar panoları ve dikey bahçe tasarımları için lüks ürün vitrini.',
      url: 'https://elivamoss.com.tr',
      image: 'images/elivamoss-cover.svg'
    },
    {
      title: 'Beyonder',
      category: 'Vitrin Sitesi / Portfolyo',
      catKey: 'kurumsal',
      desc: 'Yeni nesil etkileşimli deneyimler ve ajans işlerimizi sunduğumuz özel vitrin platformu.',
      url: 'https://beyonder.com.tr',
      image: 'images/beyonder-cover.svg'
    }
  ];

  // DOM REFERANSLARI
  const activeCat = document.getElementById('active-cat');
  const activeTitle = document.getElementById('active-title');
  const activeDesc = document.getElementById('active-desc');
  const activeLink = document.getElementById('active-link');
  const activeIdx = document.getElementById('active-idx');
  const totalCount = document.getElementById('total-count');

  function updateActiveInfo(index, item) {
    if (!item) return;
    activeCat.textContent = item.category;
    activeTitle.textContent = item.title;
    activeDesc.textContent = item.desc;
    activeLink.href = item.url;
    const total = visibleItems.length;
    const current = (index % total) + 1;
    activeIdx.textContent = String(current).padStart(2, '0');
    totalCount.textContent = String(total).padStart(2, '0');
  }

  // CIRCULAR CAROUSEL BAŞLAT
  let carousel = null;
  let visibleItems = PORTFOLIO_DATA;
  function ensureCarousel() {
    if (carousel) return carousel;
    carousel = new CircularCarousel('#circular-carousel-mount', {
    items: visibleItems,
    cardWidth: 320,
    aspectRatio: 1.35,
    gap: 32,
    tilt: -5,
    perspective: 2500,
    speed: 10,
    direction: 'left',
    draggable: true,
    momentum: 0.65,
    snap: true,
    pauseOnHover: true,
    focusOnClick: true,
    parallax: 0.25,
    depthFade: 0.35,
    fadeColor: '#e8e3f0',
    innerShade: 0.7,
    cornerRadius: 14,
    onChange: (index, item) => {
      updateActiveInfo(index, item);
    }
    });
    return carousel;
  }
  const carouselObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      ensureCarousel();
      carouselObserver.disconnect();
    }
  }, {rootMargin: '400px 0px'});
  carouselObserver.observe(document.getElementById('circular-carousel-mount'));

  updateActiveInfo(0, PORTFOLIO_DATA[0]);

  // OK BUTONLARI
  document.getElementById('cc-prev').addEventListener('click', () => ensureCarousel().prev());
  document.getElementById('cc-next').addEventListener('click', () => ensureCarousel().next());

  // FİLTRELEME
  const fbtns = document.querySelectorAll('.filters button');
  const cards = document.querySelectorAll('#portfolio .pcard');
  function selectGridCard(selected) {
    cards.forEach(card => {
      const active = card === selected;
      card.classList.toggle('is-selected', active);
      card.querySelector('.thumb').setAttribute('aria-pressed', String(active));
    });
  }
  cards.forEach(card => {
    card.querySelector('.thumb').addEventListener('click', () => selectGridCard(card));
  });
  fbtns.forEach(b => {
    b.addEventListener('click', () => {
      fbtns.forEach(x => x.classList.remove('active'));
      b.classList.add('active');
      const f = b.dataset.f;
      selectGridCard(null);

      const filtered = f === 'all'
        ? PORTFOLIO_DATA
        : PORTFOLIO_DATA.filter(item => item.catKey === f);

      visibleItems = filtered;
      if (carousel) carousel.setItems(filtered);
      updateActiveInfo(0, filtered[0]);

      cards.forEach(c => {
        c.style.display = (f === 'all' || c.dataset.cat === f) ? '' : 'none';
      });
    });
  });

  // GÖRÜNÜM GEÇİŞİ (3D Vitrin / Izgara)
  const viewCarouselBtn = document.getElementById('view-carousel-btn');
  const viewGridBtn = document.getElementById('view-grid-btn');
  const carouselViewContainer = document.getElementById('carousel-view-container');
  const portfolioGrid = document.getElementById('portfolio');

  viewCarouselBtn.addEventListener('click', () => {
    carouselViewContainer.style.display = '';
    portfolioGrid.style.display = 'none';
    viewCarouselBtn.style.background = '#fff';
    viewCarouselBtn.style.color = 'var(--navy)';
    viewCarouselBtn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
    viewGridBtn.style.background = 'transparent';
    viewGridBtn.style.color = 'var(--muted)';
    viewGridBtn.style.boxShadow = 'none';
    ensureCarousel().measure();
    carousel.wake();
  });

  viewGridBtn.addEventListener('click', () => {
    carouselViewContainer.style.display = 'none';
    portfolioGrid.style.display = 'grid';
    viewGridBtn.style.background = '#fff';
    viewGridBtn.style.color = 'var(--navy)';
    viewGridBtn.style.boxShadow = '0 2px 6px rgba(0,0,0,0.06)';
    viewCarouselBtn.style.background = 'transparent';
    viewCarouselBtn.style.color = 'var(--muted)';
    viewCarouselBtn.style.boxShadow = 'none';
  });

