'use strict';
(() => {
  const live = ['lakelandelitepowerwashing.com', 'www.lakelandelitepowerwashing.com'].includes(location.hostname);
  if (!live) return;

  // Google website-call conversion: count connected calls >= 60 seconds.
  // Only Google-supplied forwarding numbers may replace call destinations.
  // SMS links must continue to use Rob's original business number.
  try {
    if (typeof window.gtag === 'function') window.gtag('config', 'AW-18476583738/OwaUCJz79LAdELqWqepE', {
      phone_conversion_number: '(863) 362-4188',
      phone_conversion_callback(formattedNumber, mobileNumber) {
        if (typeof mobileNumber !== 'string' || !/^\+?\d{10,15}$/.test(mobileNumber)) return;
        if (typeof formattedNumber !== 'string' || !/^[+()0-9 .-]{10,30}$/.test(formattedNumber)) return;
        document.querySelectorAll('a[href^="tel:"]').forEach(link => {
          const digits = link.getAttribute('href').replace(/\D/g, '');
          if (!['8633624188', '18633624188'].includes(digits)) return;
          link.setAttribute('href', 'tel:' + mobileNumber);
          const walker = document.createTreeWalker(link, 4);
          let text;
          while ((text = walker.nextNode())) {
            text.nodeValue = text.nodeValue.replace(/(?:\+?1[ .-]*)?\(?863\)?[ .-]*362[ .-]*4188/g, formattedNumber);
          }
          const label = link.getAttribute('aria-label');
          if (label) link.setAttribute('aria-label', label.replace(/(?:\+?1[ .-]*)?\(?863\)?[ .-]*362[ .-]*4188/g, formattedNumber));
        });
      }
    });
  } catch { /* Calls and quote requests stay usable if measurement is unavailable. */ }

  const pendingKey = 'elite_estimate_pending';

  // Carry advertising attribution through same-tab navigation into the owner's
  // estimate request. Never send click IDs, form contact data or raw UTMs as
  // custom Google Analytics event parameters.
  const attributionKey = 'elite_lead_attribution_v1';
  const attributionKeys = ['gclid', 'gbraid', 'wbraid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const attributionTTL = 24 * 60 * 60 * 1000;
  function cleanAttribution(input) {
    const result = {};
    for (const key of attributionKeys) {
      const value = input[key];
      if (typeof value === 'string' && value.length <= 250 && !/[\r\n<>]/.test(value)) {
        if (['gclid', 'gbraid', 'wbraid'].includes(key) && !/^[A-Za-z0-9_.~-]+$/.test(value)) continue;
        if (value.trim()) result[key] = value.trim();
      }
    }
    return result;
  }
  function readAttribution() {
    let previous = null;
    try { previous = JSON.parse(sessionStorage.getItem(attributionKey)); } catch {}
    const age = Date.now() - previous?.captured_at;
    if (!(age >= 0 && age < attributionTTL)) previous = null;
    const params = new URLSearchParams(location.search);
    const current = cleanAttribution(Object.fromEntries(attributionKeys.map(key => [key, params.get(key)])));
    if (Object.keys(current).length) {
      // A new tagged visit replaces old attribution; never combine unrelated clicks.
      previous = {...current, landing_path: location.pathname, captured_at: Date.now()};
      try { sessionStorage.setItem(attributionKey, JSON.stringify(previous)); } catch {}
    }
    return previous ? {...cleanAttribution(previous), landing_path: previous.landing_path, captured_at: previous.captured_at} : {};
  }
  const attribution = readAttribution();
  let leadId = '';
  function attachAttribution(form) {
    try {
      if (!leadId) leadId = crypto.randomUUID();
      const source = attribution.gclid || attribution.gbraid || attribution.wbraid ||
        (attribution.utm_source?.toLowerCase() === 'google' &&
         ['cpc', 'ppc', 'paidsearch'].includes(attribution.utm_medium?.toLowerCase()))
        ? 'Google Ads' : (attribution.utm_source ? 'Tagged website visit' : 'Website (source unconfirmed)');
      const values = {lead_id: leadId, acquisition_source: source,
        ...Object.fromEntries(attributionKeys.filter(key => attribution[key]).map(key => [key, attribution[key]]))};
      if (typeof attribution.landing_path === 'string' && attribution.landing_path.startsWith('/') &&
          !/[\r\n<>?#]/.test(attribution.landing_path)) values.acquisition_landing_page = attribution.landing_path;
      if (attribution.captured_at) values.attribution_captured_at = new Date(attribution.captured_at).toISOString();
      for (const [name, value] of Object.entries(values)) {
        let input = form.elements.namedItem(name);
        if (!input) {
          input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          form.appendChild(input);
        }
        input.value = value;
      }
    } catch { /* Attribution must never block a customer's request. */ }
  }

  const allowed = new Set(['call_click', 'text_click', 'email_click', 'estimate_start', 'estimate_review', 'estimate_send_attempt', 'estimate_return', 'generate_lead']);
  function record(name) {
    if (!allowed.has(name)) return;
    try {
      if (typeof window.gtag === 'function') window.gtag('event', name, { send_to: 'G-B3X9F4V599' });
    } catch { /* Tracking must never interrupt contact or submission. */ }
  }
  window.eliteLeadTracking = Object.freeze({
    review() { record('estimate_review'); },
    success() { record('generate_lead'); },
    sendAttempt(form) {
      attachAttribution(form);
      try {
        const next = form.elements.namedItem('_next');
        const token = crypto.randomUUID();
        const returnUrl = new URL(next.value);
        returnUrl.hash = 'estimate-return=' + token;
        sessionStorage.setItem(pendingKey, JSON.stringify({ token, time: Date.now() }));
        next.value = returnUrl.href;
      } catch { /* Storage/tracking failure must not stop the existing form flow. */ }
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
  if (['/thank-you', '/thank-you.html'].includes(location.pathname)) {
    // A matching one-time return token is a completion indicator,
    // not proof of email delivery. Consume once to prevent refresh duplicates.
    try {
      const pending = JSON.parse(sessionStorage.getItem(pendingKey));
      sessionStorage.removeItem(pendingKey);
      const age = Date.now() - pending?.time;
      if (typeof pending?.token === 'string' && pending.token === window.eliteEstimateReturnToken && age >= 0 && age < 60 * 60 * 1000) record('estimate_return');
    } catch { /* Direct visits, mismatched tokens and blocked storage do not count. */ }
  }
})();
