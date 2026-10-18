/* Service landing pages share the homepage's pricing table and quote delivery. */
(() => {
  'use strict';
  const host = document.querySelector('#service-calculator');
  const pricing = window.elitePricing;
  if (!host || !pricing) return;
  const service = pricing.services.find(item => item.id === host.dataset.service);
  if (!service) return;
  const size = document.querySelector('#service-size');
  const unknown = document.querySelector('#service-unknown');
  const price = document.querySelector('#service-price');
  const hidden = document.querySelector('#landing-estimate-value');
  const summary = document.querySelector('#landing-estimate-summary');
  const button = document.querySelector('#service-request');
  document.querySelector('#service-size-label').textContent = service.label + ' (' + service.unit + ')';
  document.querySelector('#service-size-hint').textContent = service.hint;
  document.querySelector('#service-price-note').textContent = service.note;
  size.placeholder = 'e.g. ' + service.sample.toLocaleString('en-US');
  let roofMaterial;
  if(service.id==='roof') {
    const group=document.createElement('div');group.className='service-roof-options';
    group.innerHTML='<label for="service-roof-material">Roof material</label><select id="service-roof-material" aria-describedby="service-roof-note"><option value="">Choose roof material</option><option value="shingle">Asphalt shingles</option><option value="metal">Metal</option><option value="tile">Concrete / clay tile</option><option value="other">Other / unsure — custom quote</option></select><p id="service-roof-note" aria-live="polite"></p>';
    size.closest('label') ? size.closest('label').after(group) : size.after(group);
    roofMaterial=group.querySelector('select');
    roofMaterial.addEventListener('change',changed);
  }
  let started = false;
  function update() {
    size.disabled = unknown.checked;
    const result = pricing.priceFor(service, size.value, unknown.checked, roofMaterial?.value);
    const measurement = unknown.checked ? 'Measurement help requested' : size.value ? size.value + ' ' + service.unit : 'Size not provided';
    let estimate = 'Quote requested; size not provided.';
    if (result.kind === 'priced') {
      price.textContent = pricing.money(result.price);
      estimate = measurement + ' — estimated starting price: ' + pricing.money(result.price) + '.';
    } else if (result.kind === 'custom') {
      price.textContent = 'Custom quote';
      estimate = measurement + ' — custom quote required.';
    } else {
      price.textContent = result.kind === 'invalid' ? 'Check your size' : 'Enter your size';
      if (result.kind === 'invalid') estimate = 'Quote requested; measurement needs confirmation.';
    }
    size.setCustomValidity(result.kind === 'invalid' ? 'Enter a measurement greater than zero, or choose measurement help.' : '');
    if(roofMaterial) {
      estimate='Roof material: '+pricing.roofMaterialName(roofMaterial.value)+'. '+estimate;
      document.querySelector('#service-roof-note').textContent=pricing.roofMaterialNote(roofMaterial.value);
      estimate+=' '+pricing.roofMaterialNote(roofMaterial.value);
    }
    hidden.value = service.name + ': ' + estimate + ' ' + service.note;
    summary.textContent = (size.value || unknown.checked || roofMaterial?.value) ? estimate : '';
    button.disabled = result.kind === 'invalid';
  }
  function changed() {
    update();
    if (!started && typeof window.gtag === 'function') {
      started = true;
      window.gtag('event', 'calculator_start', {calculator_service: service.id});
    }
  }
  size.addEventListener('input', changed);
  unknown.addEventListener('change', changed);
  button.addEventListener('click', () => {
    update();
    document.querySelector('#quote').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    document.querySelector('#quote-form').elements.namedItem('name').focus({preventScroll:true});
  });
  document.querySelector('#quote-form').addEventListener('submit', () => {
    update();
    // The calculator is optional. An uncertain/invalid size must not block a contact request.
    // update() includes a measurement-confirmation note for Rob instead of a price.
  }, true);
  window.addEventListener('pageshow', update);
  update();
})();

