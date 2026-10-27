(() => {
  const button = document.querySelector('.burger');
  const menu = document.querySelector('.menu');
  if (!button || !menu) return;
  const narrow = matchMedia('(max-width: 900px)');
  function setOpen(open) {
    menu.classList.toggle('is-open', open);
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  }
  button.addEventListener('click', () => setOpen(!menu.classList.contains('is-open')));
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setOpen(false); });
  narrow.addEventListener('change', () => setOpen(false));
})();
