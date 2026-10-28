(() => {
  'use strict';
  const track = document.querySelector('.work-track');
  if (!track) return;
  const cards = [...track.querySelectorAll('.work-card')];
  const filters = [...document.querySelectorAll('[data-work-filter]')];
  const previous = document.getElementById('work-prev');
  const next = document.getElementById('work-next');
  const current = document.getElementById('work-current');
  const total = document.getElementById('work-total');
  const status = document.getElementById('work-status');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = cards;
  let active = 0;
  let scrollFrame = 0;
  let drag = null;
  let suppressClick = false;

  const nearest = () => {
    const start = track.scrollLeft + visible[0].offsetLeft;
    let distance = Infinity, index = 0;
    visible.forEach((card, i) => {
      const delta = Math.abs(card.offsetLeft - start);
      if (delta < distance) { distance = delta; index = i; }
    });
    return index;
  };
  const updateNavigation = () => {
    scrollFrame = 0;
    active = nearest();
    const end = track.scrollLeft + track.clientWidth;
    let lastVisible = active;
    visible.forEach((card, i) => {
      if (i >= active && card.offsetLeft + card.offsetWidth * 0.9 <= end) lastVisible = i;
    });
    current.textContent = String(active + 1).padStart(2, '0') + (lastVisible > active ? '–' + String(lastVisible + 1).padStart(2, '0') : '');
    total.textContent = String(visible.length).padStart(2, '0');
    previous.disabled = track.scrollLeft <= 2;
    next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
  };
  const goTo = index => {
    const card = visible[Math.max(0, Math.min(visible.length - 1, index))];
    if (!card) return;
    track.scrollTo({left: card.offsetLeft - visible[0].offsetLeft, behavior: motion.matches ? 'instant' : 'smooth'});
  };
  const select = card => {
    cards.forEach(item => {
      const selected = item === card;
      item.classList.toggle('is-selected', selected);
      item.querySelector('.work-select').setAttribute('aria-pressed', String(selected));
    });
    if (card) {
      goTo(visible.indexOf(card));
      status.textContent = card.querySelector('h3').textContent + ' seçildi.';
    }
  };
  cards.forEach(card => card.querySelector('.work-select').addEventListener('click', () => select(card)));
  previous.addEventListener('click', () => goTo(active - 1));
  next.addEventListener('click', () => goTo(active + 1));
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    const category = button.dataset.workFilter;
    select(null);
    cards.forEach(card => { card.hidden = category !== 'all' && card.dataset.category !== category; });
    visible = cards.filter(card => !card.hidden);
    track.scrollTo({left: 0, behavior: 'instant'});
    updateNavigation();
    status.textContent = button.textContent + ': ' + visible.length + ' proje.';
  }));
  track.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateNavigation);
  }, {passive: true});
  track.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const focused = visible.indexOf(event.target.closest('.work-card'));
      const index = Math.max(0, Math.min(visible.length - 1, (focused < 0 ? active : focused) + (event.key === 'ArrowRight' ? 1 : -1)));
      visible[index].querySelector('.work-select').focus({preventScroll: true});
      goTo(index);
    } else if (event.key === 'Escape') select(null);
  });

  // Touch uses native scrolling. Mouse dragging never turns into a card click.
  track.addEventListener('pointerdown', event => {
    suppressClick = false;
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('a')) return;
    drag = {id: event.pointerId, x: event.clientX, scroll: track.scrollLeft, moved: false};
  });
  track.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    const distance = event.clientX - drag.x;
    if (!drag.moved && Math.abs(distance) < 7) return;
    if (!drag.moved) {
      drag.moved = true;
      track.classList.add('is-dragging');
      track.setPointerCapture(event.pointerId);
    }
    track.scrollLeft = drag.scroll - distance;
  });
  const finishDrag = event => {
    if (!drag || drag.id !== event.pointerId) return;
    suppressClick = drag.moved;
    drag = null;
    track.classList.remove('is-dragging');
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
  };
  window.addEventListener('pointerup', finishDrag, {passive: true});
  window.addEventListener('pointercancel', finishDrag, {passive: true});
  track.addEventListener('lostpointercapture', finishDrag);
  track.addEventListener('click', event => {
    if (!suppressClick) return;
    suppressClick = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  new ResizeObserver(updateNavigation).observe(track);
  updateNavigation();
})();
