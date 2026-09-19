'use strict';
const quoteForm = document.querySelector('#quote-form');
const serviceInputs = [...quoteForm.querySelectorAll('input[name="service"]')];
const allowedServices = serviceInputs.map(input => input.value);
const serviceError = document.querySelector('#service-error');
const dialog = document.querySelector('#request-dialog');
const preview = document.querySelector('#request-preview');
let draft = '';
let lastDialogFocus = null;
function selectedServices() { return serviceInputs.filter(input => input.checked).map(input => input.value); }
function syncServices() {
  serviceInputs.forEach(input => { input.nextElementSibling.querySelector('b').textContent = input.checked ? '✓' : '+'; });
  if (selectedServices().length) serviceError.hidden = true;
}
serviceInputs.forEach(input => input.addEventListener('change', syncServices));
document.querySelectorAll('[data-select-service]').forEach(button => {
  button.addEventListener('click', () => {
    const input = serviceInputs.find(item => item.value === button.dataset.selectService);
    if (input) input.checked = true;
    syncServices();
    document.querySelector('#quote').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    if (input) input.focus({ preventScroll: true });
  });
});
function prepareDraft() {
  const data = new FormData(quoteForm);
  const name = String(data.get('name') || '').trim();
  const zip = String(data.get('zip') || '').trim();
  const address = String(data.get('address') || '').trim();
  const phone = String(data.get('phone') || '').trim();
  const details = String(data.get('details') || '').trim();
  draft = `Hi Lakeland Elite,\n\nI'd like a free estimate for my property.\n\nServices: ${selectedServices().join(', ')}\nName: ${name}\nService address: ${address}\nProperty ZIP: ${zip}${phone ? `\nPhone: ${phone}` : ''}${details ? `\n\nAbout the job:\n${details}` : ''}\n\nPlease let me know what other details you need. Thank you!`;
  preview.textContent = draft;
  document.querySelector('#email-request').href = 'mailto:Rob@Lakelandelitepowerwashing.com?subject=' + encodeURIComponent(`Free estimate request — ${zip}`) + '&body=' + encodeURIComponent(draft);
  document.querySelector('#copy-status').textContent = '';
  lastDialogFocus = document.activeElement;
  dialog.showModal();
}
quoteForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!selectedServices().length) { serviceError.hidden = false; serviceInputs[0].focus(); return; }
  if (!String(new FormData(quoteForm).get('name') || '').trim()) {
    quoteForm.elements.namedItem('name').setCustomValidity('Please enter your name.');
    quoteForm.elements.namedItem('name').reportValidity();
    return;
  }
  if (!String(new FormData(quoteForm).get('address') || '').trim()) {
    quoteForm.elements.namedItem('address').setCustomValidity('Please enter the service address.');
    quoteForm.elements.namedItem('address').reportValidity();
    return;
  }
  prepareDraft();
});
quoteForm.elements.namedItem('name').addEventListener('input', () => quoteForm.elements.namedItem('name').setCustomValidity(''));
quoteForm.elements.namedItem('address').addEventListener('input', () => quoteForm.elements.namedItem('address').setCustomValidity(''));
document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  }
});
dialog.addEventListener('close', () => { if (lastDialogFocus) lastDialogFocus.focus({ preventScroll: true }); });
document.querySelector('#copy-request').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(draft);
    status.textContent = 'Copied. Paste it into an email to Rob@Lakelandelitepowerwashing.com.';
  } catch {
    const range = document.createRange(); range.selectNodeContents(preview);
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    status.textContent = 'The request is selected. Use your device’s Copy action, then paste it into your email.';
  }
});
const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('#mobile-nav');
function closeMenu() { mobileNav.hidden = true; menuButton.setAttribute('aria-expanded', 'false'); menuButton.setAttribute('aria-label', 'Open menu'); }
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open)); menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); mobileNav.hidden = !open;
});
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
matchMedia('(min-width: 701px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
document.querySelector('#year').textContent = String(new Date().getFullYear());
// Optional page-scoped API: stages the visible form; never sends a message.
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  try {
    Promise.resolve(document.modelContext.registerTool({
      name: 'stage_estimate_request', title: 'Stage an estimate request',
      description: 'Fill the visible estimate form with selected services and customer details. Does not send, book, or open an email app. The visitor reviews and sends the request themselves.',
      inputSchema: { type: 'object', properties: { services: { type: 'array', items: { type: 'string', enum: allowedServices }, minItems: 1, uniqueItems: true }, name: { type: 'string', minLength: 1, maxLength: 100 }, address: { type: 'string', minLength: 1, maxLength: 200 }, zip: { type: 'string', pattern: '^[0-9]{5}$' }, phone: { type: 'string', maxLength: 30 }, details: { type: 'string', maxLength: 1800 } }, required: ['services', 'name', 'address', 'zip'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input) {
        if (!input || typeof input !== 'object' || Object.keys(input).some(key => !['services', 'name', 'address', 'zip', 'phone', 'details'].includes(key)) || !Array.isArray(input.services) || !input.services.length || input.services.some(service => !allowedServices.includes(service)) || new Set(input.services).size !== input.services.length || typeof input.name !== 'string' || !input.name.trim() || input.name.length > 100 || typeof input.address !== 'string' || !input.address.trim() || input.address.length > 200 || typeof input.zip !== 'string' || !/^[0-9]{5}$/.test(input.zip) || (input.phone !== undefined && (typeof input.phone !== 'string' || input.phone.length > 30)) || (input.details !== undefined && (typeof input.details !== 'string' || input.details.length > 1800))) throw new Error('Provide a valid name, service address, five-digit ZIP, and supported services.');
        serviceInputs.forEach(checkbox => { checkbox.checked = input.services.includes(checkbox.value); });
        for (const key of ['name', 'address', 'zip', 'phone', 'details']) quoteForm.elements.namedItem(key).value = input[key] || '';
        quoteForm.elements.namedItem('name').setCustomValidity(''); quoteForm.elements.namedItem('address').setCustomValidity(''); syncServices();
        document.querySelector('#quote').scrollIntoView();
        return { status: 'staged', services: selectedServices(), name: quoteForm.elements.namedItem('name').value, zip: quoteForm.elements.namedItem('zip').value, sent: false };
      }
    }, { signal: lifecycle.signal })).catch(() => {});
  } catch { /* Ordinary form remains available if registration is unsupported. */ }
  window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
}
