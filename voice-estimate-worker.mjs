import pricing from './dist/price-calculator.js';

const { services, priceFor, bundleTotals, money, roofMaterials, strainerCount } = pricing;
const supportedServices = new Set(['driveway', 'house', 'roof', 'gutter']);
const endpoint = '/api/voice-estimate';
const approval = 'Rob will review the job details and must approve the final price before any work is confirmed.';
const review = {
  status: 'review_required',
  customer_message: 'I’ll take down the details so Rob can review the job and confirm the price with you.',
};

function json(data, options = {}) {
  return Response.json(data, {
    ...options,
    headers: { 'Cache-Control': 'no-store', ...options.headers },
  });
}

function calculateEstimate({ items } = {}) {
  if (!Array.isArray(items) || items.length < 1 || items.length > supportedServices.size) return review;

  const estimates = [];
  const seen = new Set();
  for (const item of items) {
    if (!item || !supportedServices.has(item.service) || seen.has(item.service)
        || item.standard_job !== true || (item.service !== 'driveway' && item.stories !== 1)
        || !(typeof item.size === 'number' && Number.isFinite(item.size) && item.size > 0)) return review;

    const service = services.find(({ id }) => id === item.service);
    let option = '';
    if (service.id === 'roof') {
      if (!Object.hasOwn(roofMaterials, item.roof_material) || !roofMaterials[item.roof_material].prices) return review;
      option = item.roof_material;
    }
    if (service.id === 'driveway' || service.id === 'house') {
      if (typeof item.mobile_home !== 'boolean') return review;
      if (item.mobile_home) option = 'mobile-home';
    }

    const result = priceFor(service, item.size, false, option);
    const strainers = item.strainers ?? 0;
    if (result.kind !== 'priced' || !Number.isSafeInteger(strainers)
        || strainerCount(strainers) === null || (service.id !== 'gutter' && strainers !== 0)) return review;

    seen.add(service.id);
    estimates.push({ service, result, strainers });
  }

  const totals = bundleTotals(estimates);
  const scope = totals.eligible ? ' if all services are done at the same property in one visit' : '';
  return {
    status: 'starting_estimate',
    starting_price_usd: totals.sum,
    final_approval_required: true,
    customer_message: `Based on what you’ve told me, the starting price is ${money(totals.sum)}${scope}. ${approval}`,
  };
}

export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== endpoint) return env.ASSETS.fetch(request);
    if (request.method !== 'POST') return json({ error: 'Use POST.' }, { status: 405, headers: { Allow: 'POST' } });

    let input;
    try {
      input = await request.json();
    } catch {
      return json({ error: 'Enter a valid JSON request.' }, { status: 400 });
    }

    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return json({ error: 'Enter a JSON object.' }, { status: 400 });
    }
    return json(calculateEstimate(input));
  },
};
