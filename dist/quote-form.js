/* Shared quote flow. Contact details are sent only after an explicit form submission. */
(() => {
  'use strict';
  const productionHosts = ['lakelandelitepowerwashing.com', 'www.lakelandelitepowerwashing.com'];
  function parseContact(preference, raw) {
    const value = String(raw || '').trim();
    if (!['text', 'call', 'email'].includes(preference)) return {error: 'Choose how you would like Rob to reply.'};
    if (preference === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254
        ? {email: value, phone: ''} : {error: 'Enter a valid email address.'};
    }
    const digits = value.replace(/\D/g, '');
    return /^[+()\d\s.\-]+$/.test(value) && digits.length >= 10 && digits.length <= 15
      ? {email: '', phone: value} : {error: 'Enter your phone number, including the area code.'};
  }
  function canDeliver(config, hostname) {
    return productionHosts.includes(hostname) && config?.enabled === true && config?.paused !== true && config?.provider === 'formspree' && /^https:\/\/formspree\.io\/f\/[A-Za-z0-9]+$/.test(String(config?.endpoint || ''));
  }
  async function deliver(config, hostname, data, fetcher) {
    if (!canDeliver(config, hostname)) return {sent: false, reason: 'disabled'};
    const response = await fetcher(config.endpoint, {method: 'POST', body: data, headers: {Accept: 'application/json'}});
    if (!response.ok) return {sent: false, reason: 'rejected'};
    return {sent: true};
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {parseContact, canDeliver, deliver};
    return;
  }
  const form = document.querySelector('#quote-form');
  if (!form) return;
  const field = name => form.elements.namedItem(name);
  const preference = field('contact_preference');
  const contact = field('contact');
  const status = document.querySelector('#quote-status');
  const fallback = document.querySelector('#quote-fallback');
  const emailFallback = document.querySelector('#quote-email-fallback');
  const submit = form.querySelector('[type="submit"]');
  const config = window.estimateDelivery || {};
  const serviceInputs = [...form.querySelectorAll('input[name="service"]')];
  const servicePicker = document.querySelector('#requested-service');
  let inFlight = false;
  let delivered = false;
  const previewMode = !productionHosts.includes(location.hostname);
  document.querySelector('#delivery-preview-note').hidden = !previewMode;
  // This form has no native action: preview hosts cannot accidentally send to production.
  const services = () => serviceInputs.filter(input => input.checked).map(input => input.value);
  function syncServices() {
    field('services').value = (services().length ? services() : ['Help me decide']).join(', ');
  }
  function syncContact() {
    const wantsEmail = preference.value === 'email';
    contact.required = !wantsEmail;
    field('email').required = wantsEmail;
    document.querySelector('#contact-label').textContent = wantsEmail ? 'Your phone number (optional)' : 'Your phone number';
    document.querySelector('#email-optional').hidden = wantsEmail;
    contact.setCustomValidity('');
    field('email').setCustomValidity('');
    field('phone').value = parseContact('call', contact.value).phone || '';
  }
  preference.addEventListener('change', syncContact);
  contact.addEventListener('input', syncContact);
  field('email').addEventListener('input', syncContact);
  for (const name of ['name', 'address']) field(name).addEventListener('input', () => field(name).setCustomValidity(''));
  serviceInputs.forEach(input => input.addEventListener('change', syncServices));
  servicePicker?.addEventListener('change', () => {
    serviceInputs.forEach(input => { input.checked = input.value === servicePicker.value; });
    syncServices();
  });
  document.querySelectorAll('[data-select-service]').forEach(button => button.addEventListener('click', () => {
    const chosen = serviceInputs.find(input => input.value === button.dataset.selectService);
    if (chosen) chosen.checked = true;
    syncServices();
    document.querySelector('#quote').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    field('name').focus({preventScroll: true});
  }));
  function prepareFallback() {
    const parts = ["I'd like a free estimate from Lakeland Elite.", 'Services: ' + field('services').value,
      'Name: ' + field('name').value.trim(), 'Property: ' + field('address').value.trim(),
      'Preferred reply: ' + preference.value, 'Phone: ' + contact.value.trim(), 'Email: ' + field('email').value.trim(),
      field('calculator_estimate')?.value || '', field('details').value.trim()];
    if (field('promotion_request')?.checked && !field('promotion_request').disabled) parts.push(field('promotion_request').value);
    emailFallback.href = 'mailto:rob@lakelandelitepowerwashing.com?subject=' + encodeURIComponent('Estimate request — ' + field('name').value.replace(/[\r\n]/g, ' ').trim()) + '&body=' + encodeURIComponent(parts.filter(Boolean).join('\n\n'));
  }
  emailFallback.addEventListener('click', () => {
    status.textContent = 'Finish sending in your email app. Opening the draft does not send it.';
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (inFlight || delivered) return;
    syncServices();
    syncContact();
    for (const name of ['name', 'address']) {
      if (!field(name).value.trim()) {
        field(name).setCustomValidity('Please enter your ' + (name === 'name' ? 'name.' : 'property address.'));
        field(name).reportValidity();
        return;
      }
    }
    const preferredField = preference.value === 'email' ? field('email') : contact;
    const parsed = parseContact(preference.value, preferredField.value);
    if (parsed.error) { preferredField.setCustomValidity(parsed.error); preferredField.reportValidity(); return; }
    for (const [type, input] of [['call', contact], ['email', field('email')]]) {
      if (!input.value.trim()) continue;
      const result = parseContact(type, input.value);
      if (result.error) { input.setCustomValidity(result.error); input.reportValidity(); return; }
    }
    field('email').value = field('email').value.trim();
    if (!form.reportValidity()) return;
    field('zip').value = /\b(\d{5})(?:-\d{4})?\s*$/.exec(field('address').value.trim())?.[1] || '';
    prepareFallback();
    fallback.hidden = true;
    if (previewMode) {
      status.textContent = 'Preview only — your details are valid, but no request was sent.';
      return;
    }
    if (!canDeliver(config, location.hostname)) {
      status.textContent = 'Online requests are temporarily unavailable. Please call, text, or open your request in email.';
      fallback.hidden = false;
      return;
    }
    const name = field('name').value.replace(/[\r\n]+/g, ' ').trim().slice(0, 100);
    const date = new Intl.DateTimeFormat('en-US', {timeZone: 'America/New_York', month: 'short', day: 'numeric', year: 'numeric'}).format(new Date());
    const id = Array.from(crypto.getRandomValues(new Uint32Array(2)), n => n.toString(16).padStart(8, '0')).join('').toUpperCase();
    field('_subject').value = `New Estimate — ${name} — ${date} — ${id}`;
    inFlight = true;
    submit.disabled = true;
    submit.textContent = 'Sending your request…';
    status.textContent = 'Sending your estimate request securely…';
    window.eliteLeadTracking?.sendAttempt(form);
    try {
      const result = await deliver(config, location.hostname, new FormData(form), window.fetch.bind(window));
      if (!result.sent) throw new Error('Delivery not confirmed');
      delivered = true;
      // This is receipt by the form service, not a booked job or proof of inbox delivery.
      try { window.eliteLeadTracking?.success(); } catch { /* Analytics never blocks a lead. */ }
      status.textContent = 'Your request was received. Rob will follow up using your preferred contact method.';
      submit.textContent = 'Request received';
      const next = new URL(field('_next').value, location.origin);
      if (productionHosts.includes(next.hostname) && next.protocol === 'https:') window.location.assign(next.href);
    } catch {
      status.textContent = 'We could not confirm delivery. Your details are still here. Please call or text Rob before submitting again, or use the email option below.';
      fallback.hidden = false;
      submit.disabled = false;
      submit.textContent = 'Try sending again';
    } finally { inFlight = false; }
  });
  window.addEventListener('pageshow', () => { inFlight = false; delivered = false; submit.disabled = false; submit.textContent = 'Send my free quote request ↗'; syncContact(); syncServices(); });
  syncContact();
  syncServices();
  // Preserve homepage navigation and calculator-to-form handoff.
  const menuButton = document.querySelector('.menu-button');
  const mobileNav = document.querySelector('#mobile-nav');
  if (menuButton && mobileNav) {
    function closeMenu() { mobileNav.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open menu'); }
    menuButton.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') !== 'true'; mobileNav.hidden = !open; menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); });
    mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    document.addEventListener('click', e => { if (!e.target.closest('.site-header')) closeMenu(); });
    matchMedia('(min-width:701px)').addEventListener('change', e => { if (e.matches) closeMenu(); });
  }
  const year = document.querySelector('#year');
  if (year) year.textContent = String(new Date().getFullYear());
  if (document.modelContext?.registerTool) {
    const lifecycle = new AbortController();
    try {
      Promise.resolve(document.modelContext.registerTool({
        name: 'stage_estimate_request', title: 'Stage an estimate request',
        description: 'Fill the visible estimate form. Does not send or book. The visitor must submit the form.',
        inputSchema: {type: 'object', properties: {services: {type: 'array', items: {type: 'string', enum: serviceInputs.map(input => input.value)}, minItems: 1, uniqueItems: true}, name: {type: 'string', minLength: 1, maxLength: 100}, address: {type: 'string', minLength: 1, maxLength: 200}, contact_preference: {type: 'string', enum: ['text','call','email']}, contact: {type: 'string', minLength: 1, maxLength: 254}, details: {type: 'string', maxLength: 1800}}, required: ['services','name','address','contact_preference','contact'], additionalProperties: false},
        annotations: {readOnlyHint: false, untrustedContentHint: false},
        execute(input) {
          if (!input || Object.keys(input).some(key => !['services','name','address','contact_preference','contact','details'].includes(key)) || !Array.isArray(input.services) || !input.services.length || input.services.some(value => !serviceInputs.some(item => item.value === value)) || typeof input.name !== 'string' || !input.name.trim() || input.name.length > 100 || typeof input.address !== 'string' || !input.address.trim() || input.address.length > 200 || typeof input.contact !== 'string' || input.contact.length > 254 || parseContact(input.contact_preference,input.contact).error || (input.details !== undefined && (typeof input.details !== 'string' || input.details.length > 1800))) throw new Error('Provide a valid name, address, contact method and supported services.');
          serviceInputs.forEach(item => { item.checked = input.services.includes(item.value); });
          for (const key of ['name','address','contact_preference','details']) field(key).value = input[key] || '';
          field(input.contact_preference === 'email' ? 'email' : 'contact').value = input.contact;
          field('name').setCustomValidity(''); field('address').setCustomValidity('');
          syncContact(); syncServices(); document.querySelector('#quote').scrollIntoView();
          return {status: 'staged', sent: false};
        }
      }, {signal: lifecycle.signal})).catch(() => {});
    } catch { /* Ordinary form remains available. */ }
    window.addEventListener('pagehide', () => lifecycle.abort(), {once: true});
  }
})();
