# Lakeland Elite landing page

A dependency-free responsive landing page with service selection and an email estimate draft. Authored static output lives in `dist/`. No build step is needed.

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
