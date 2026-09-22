'use strict';
(() => {
  const live = ['lakelandelitepowerwashing.com', 'www.lakelandelitepowerwashing.com'].includes(location.hostname);
  if (!live) return;
  const pendingKey = 'elite_estimate_pending';
  const allowed = new Set(['call_click', 'text_click', 'email_click', 'estimate_start', 'estimate_review', 'estimate_send_attempt', 'estimate_return']);
  function record(name) {
    if (!allowed.has(name)) return;
    try {
      if (typeof window.gtag === 'function') window.gtag('event', name, { send_to: 'G-B3X9F4V599' });
    } catch { /* Tracking must never interrupt contact or submission. */ }
  }
  window.eliteLeadTracking = Object.freeze({
    review() { record('estimate_review'); },
    sendAttempt() {
      try { sessionStorage.setItem(pendingKey, String(Date.now())); } catch { /* Storage is optional. */ }
      record('estimate_send_attempt');
    }
  });
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    const href = link.getAttribute('href').toLowerCase();
    if (href.startsWith('tel:')) record('call_click');
    else if (href.startsWith('sms:')) record('text_click');
    else if (href.startsWith('mailto:')) record('email_click');
  });
  const form = document.querySelector('#quote-form');
  if (form) {
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      record('estimate_start');
    };
    form.addEventListener('input', start);
    form.addEventListener('change', start);
    document.querySelectorAll('[data-select-service]').forEach(button => button.addEventListener('click', start));
  }
  if (location.pathname === '/thank-you.html') {
    // A recent attempt plus a FormSubmit return is a completion indicator,
    // not proof of email delivery. Consume once to prevent refresh duplicates.
    try {
      const pending = Number(sessionStorage.getItem(pendingKey));
      sessionStorage.removeItem(pendingKey);
      const age = Date.now() - pending;
      const fromFormSubmit = new URL(document.referrer).hostname === 'formsubmit.co';
      if (pending > 0 && age >= 0 && age < 60 * 60 * 1000 && fromFormSubmit) record('estimate_return');
    } catch { /* Direct visits, missing referrers and blocked storage do not count. */ }
  }
})();
