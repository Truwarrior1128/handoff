(() => {
  'use strict';
  const rating = document.getElementById('google-review-rating');
  if (!rating) return;
  const value = Number(rating.textContent.trim());
  if (!Number.isFinite(value) || value < 0 || value > 5) return;
  const stars = document.createElement('span');
  stars.id = 'google-review-stars';
  stars.setAttribute('aria-hidden', 'true');
  stars.textContent = '★★★★★';
  Object.assign(stars.style, {
    display: 'inline-block',
    fontFamily: 'Arial, sans-serif',
    fontSize: '24px',
    lineHeight: '1.2',
    letterSpacing: '2px',
    whiteSpace: 'nowrap',
    background: 'linear-gradient(to right, #b77900 ' + value / 5 * 100 + '%, #d8dee5 ' + value / 5 * 100 + '%)',
    backgroundClip: 'text',
    webkitBackgroundClip: 'text',
    color: 'transparent'
  });
  rating.parentElement.style.flexWrap = 'wrap';
  rating.parentElement.appendChild(stars);
})();
