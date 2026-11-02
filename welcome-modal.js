(() => {
  'use strict';

  const STORAGE_KEY = 'tt_welcome_seen';

  function initWelcomeModal() {
    const dialog = document.getElementById('welcome-modal');
    if (!dialog) return;

    const closeBtn = dialog.querySelector('.welcome-close-btn');
    const continueBtn = document.getElementById('welcome-continue-btn');
    const inner = dialog.querySelector('.welcome-dialog-inner');

    let isClosing = false;

    function openModal() {
      if (dialog.open) return;
      isClosing = false;
      dialog.classList.remove('is-closing');
      try {
        dialog.showModal();
        document.documentElement.classList.add('welcome-open');
        // Focus continue or close button politely
        if (continueBtn) continueBtn.focus({ preventScroll: true });
      } catch (e) {
        // Fallback for older browsers
        dialog.setAttribute('open', '');
      }
    }

    function closeModal() {
      if (!dialog.open || isClosing) return;
      isClosing = true;

      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch (err) {
        // Ignore storage exceptions (e.g. private mode restrictions)
      }

      dialog.classList.add('is-closing');
      document.documentElement.classList.remove('welcome-open');

      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const delay = prefersReducedMotion ? 0 : 280;

      setTimeout(() => {
        try {
          dialog.close();
        } catch (e) {
          dialog.removeAttribute('open');
        }
        dialog.classList.remove('is-closing');
        isClosing = false;
      }, delay);
    }

    // Attach button listeners
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (continueBtn) continueBtn.addEventListener('click', closeModal);

    // Backdrop click detection
    dialog.addEventListener('pointerdown', (e) => {
      if (e.target === dialog) {
        // User clicked backdrop outside inner card
        closeModal();
      }
    });

    // Handle ESC key gracefully with animation
    dialog.addEventListener('cancel', (e) => {
      e.preventDefault();
      closeModal();
    });

    // Global helper methods for testing / manual triggering
    window.openWelcomeModal = openModal;
    window.closeWelcomeModal = closeModal;

    // Check if should automatically show
    const urlParams = new URLSearchParams(window.location.search);
    const forceShow = urlParams.has('welcome') || urlParams.has('popup') || urlParams.has('modal');
    let hasSeen = false;
    try {
      hasSeen = sessionStorage.getItem(STORAGE_KEY) === '1';
    } catch (err) {
      hasSeen = false;
    }

    if (!hasSeen || forceShow) {
      // Small timeout to allow the hero section to render elegantly first
      setTimeout(openModal, 450);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWelcomeModal);
  } else {
    initWelcomeModal();
  }
})();
