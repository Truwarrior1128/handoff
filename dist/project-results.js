(() => {
 document.querySelectorAll('#real-results .card').forEach(card => {
  const range=card.querySelector('input[type="range"]'), comparison=card.querySelector('.compare');
  if(!range||!comparison)return;
  function update(){comparison.style.setProperty('--split',range.value+'%');range.setAttribute('aria-valuetext',range.value+' percent before photo visible');}
  range.addEventListener('input',update);
  function move(e){const rect=comparison.getBoundingClientRect();if(!rect.width)return;range.value=Math.round(Math.max(0,Math.min(100,(e.clientX-rect.left)/rect.width*100)));update();}
  comparison.addEventListener('pointerdown',e=>{if(!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0))return;comparison.setPointerCapture(e.pointerId);move(e);});
  comparison.addEventListener('pointermove',e=>{if(comparison.hasPointerCapture(e.pointerId))move(e);});
  const release=e=>{if(comparison.hasPointerCapture(e.pointerId))comparison.releasePointerCapture(e.pointerId);};
  comparison.addEventListener('pointerup',release);comparison.addEventListener('pointercancel',release);
  comparison.addEventListener('dragstart',e=>e.preventDefault());update();
 });
})();
