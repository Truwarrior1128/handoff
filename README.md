# Lakeland Elite landing page

A responsive landing page with service selection and an estimate request form. Authored static output lives in `dist/`. No build step is needed.

The quote flow validates service selection, name, and ZIP, previews an email, and opens the visitor's email application only after an explicit click. No outbound message, booking, or lead storage happens on this site. Phone and email links use the business's published contact information.

Business details are based on https://www.lakelandelitepowerwashing.com/ retrieved September 11, 2026. The original advertises general liability insurance, free estimates, residential and commercial services, and an approximately 10–15 mile service area from North Lakeland. No review counts, testimonials, certifications, prices, guarantees, or job results have been invented. Lawn edging was marked coming soon and is excluded.

The homepage hero is AI-generated illustrative artwork, not a completed company project. The washing photo is reused from the supplied website: https://mightysites.s3.amazonaws.com/assets/0/0/0/yHus9MRnh1FuCOiH6FUuCFmCJWUcgqcpiIM9kTD9.jpg . It is not presented as a before/after or verified company job. Confirm asset reuse rights and business information before a public launch.

Manrope is locally served from Google Fonts; the family is licensed under the SIL Open Font License. See `FONT-LICENSE.txt`.

WebMCP optionally exposes `stage_estimate_request` when `document.modelContext` is available. It stages the visible form and never sends. A supported browser validation context was unavailable in this environment; static validation does not constitute WebMCP runtime validation.

Hosting identity is in `.openai/hosting.json`.

## Animated Elite scene

The hero's Wash now button opens a one-click canvas animation: the original illustrated mascot enters, pressure-washes the driveway in four passes, and finishes with a thumbs-up and sparkling smile. Includes pause/resume, replay, skip-to-smile, optional audio, a shorter reduced-motion timeline, and a direct #power-wash link. Generated assets are illustrative and do not depict customer work. Additional imagery loads when the animation opens.

Validated JavaScript and local asset references, plus native-canvas controller playback covering image loading, progressive cleaning, pause/resume, completion, replay, skip, and shutdown. Inspected rendered action and victory frames. No browser-based QA was requested or performed.

## September 19 contact and hours update

- The approved white-background logo is used unchanged, with 25% larger header/footer dimensions and rounded corners.
- `dist/hours.js` calculates the repeating 14-day schedule in America/New_York, anchored September 19, 2026. Days 0–2 are closed, 3–4 open, 5–6 closed, 7–9 open, 10–11 closed, and 12–13 open. Open hours are 9 AM–5 PM. The display refreshes every 30 seconds and on returning to the tab.
- The estimate form requires the service address and includes it in the email preview and mailto draft. This remains an email-app workflow; nothing is sent by the website itself.
- Footer phone/email buttons use `tel:` and `mailto:` links. Google buttons use the owner-supplied share link and say “Find us on Google”; no rating or direct-reviews destination is claimed.
- HTTPS badges describe transport encryption only, not a third-party certification. Local HTTP previews explicitly refer to HTTPS on the live site.
- Optional local review: `npm ci`, then `npm run dev`. Vite serves the authored `dist/` unchanged; production still needs no build command. Existing Cloudflare configuration is unchanged.

## September 20 audit fixes — preview only

- Google review panel: 5.0 / 1 review, manually verified September 20, 2026 against the business name, website and phone in Google. The displayed verification date makes this a dated snapshot, not an automatically updated feed. Links open the observed Google review dialog.
- Logo: exports the existing approved native SVG correction into a standalone PNG used by header, footer and favicon. No artwork redesign.
- Service choices now explicitly include house/roof cleaning and gutter cleaning; card buttons select corresponding choices.
- Direct delivery is prepared using FormSubmit native HTTPS POST with its default CAPTCHA, a honeypot, required reply email, and a thank-you page. No email-app launch.
- IMPORTANT: delivery-config.js is disabled for review. It must NOT be enabled/published until the owner activates FormSubmit and a clearly marked test is received. This turn sends no activation or test emails. Preview hosts always stay in simulation mode. No live deployment was made.
- Before launch: activate recipient, confirm an end-to-end test with multiple services/address/reply email, enable delivery for the production hostname, and obtain Rob's approval. No fees or accounts have been accepted.

## September 22 contact analytics

`dist/lead-tracking.js` adds production-only events to GA4 G-B3X9F4V599. No form field values or link destinations are included in these custom event parameters.

- `call_click`, `text_click`, `email_click`: contact-link clicks, not completed communications.
- `estimate_start`: first form input/change or service-card selection per page load.
- `estimate_review`: valid estimate review opened.
- `estimate_send_attempt`: validated final send, immediately before native FormSubmit POST.
- `estimate_return`: thank-you page reached with a same-tab attempt less than an hour old and a FormSubmit referrer. Pending state is consumed once. This is a completion indicator, not proof of delivery. Missing referrers or blocked session storage cause undercounting. Do not report it as a verified lead until the actual CAPTCHA/return flow has been tested.

Preview hosts send no custom events. Analytics/storage errors do not block submission. No extra Google tag is installed. Google's automatic form events may also appear; do not sum those with these custom events as separate leads.

Run `node tests/lead-tracking.cjs`. After publication, verify contact events in Realtime and complete a clearly labeled test estimate through CAPTCHA. Confirm the email arrives, `estimate_send_attempt` and `estimate_return` appear once, and reloading thank-you does not add another return. Then mark selected contact events and the verified return event as key events in GA Admin > Data display > Events. Do not mark starts, reviews or send attempts as completed leads.
