(() => {
  'use strict';
  // Valid through December 1 in the business's local time, including the whole day.
  const offerActive = Date.now() < Date.parse('2026-12-02T00:00:00-05:00');
  document.querySelectorAll('[data-driveway-offer]').forEach(element => {
    element.hidden = !offerActive;
    element.querySelectorAll('input').forEach(input => { input.disabled = !offerActive; if (!offerActive) input.checked = false; });
  });
  document.querySelectorAll('.lp-project').forEach(card => {
    const range = card.querySelector('input[type="range"]');
    const comparison = card.querySelector('.lp-compare');
    if (!range || !comparison) return;
    function update() { comparison.style.setProperty('--split', range.value + '%'); range.setAttribute('aria-valuetext', range.value + ' percent before photo visible'); }
    range.addEventListener('input', update);
    function move(event) { const box = comparison.getBoundingClientRect(); if (!box.width) return; range.value = Math.round(Math.max(0, Math.min(100, (event.clientX - box.left) / box.width * 100))); update(); }
    comparison.addEventListener('pointerdown', event => { if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return; comparison.setPointerCapture(event.pointerId); move(event); });
    comparison.addEventListener('pointermove', event => { if (comparison.hasPointerCapture(event.pointerId)) move(event); });
    const release = event => { if (comparison.hasPointerCapture(event.pointerId)) comparison.releasePointerCapture(event.pointerId); };
    comparison.addEventListener('pointerup', release); comparison.addEventListener('pointercancel', release);
    comparison.addEventListener('dragstart', event => event.preventDefault()); update();
  });
})();
