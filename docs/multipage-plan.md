# Multi-page site and interactive music experience: plan

Status: public pages, persistent player and turntable are being built against
labelled development fixtures. Stripe, the contact workflow and admin editing
of social links wait on the decisions at the end of this document.

## Route map

| Route | Purpose | Data (published only) | Empty state |
| --- | --- | --- | --- |
| `/` | Hero, featured release, listening room with the turntable, platforms, label teaser | featured release + its tracks and links | Turntable shows "no audio yet"; platform rows say "Link pending" |
| `/music` | Catalogue index, filter by format | all published releases | "The catalogue opens with the first release." |
| `/music/[slug]` | Release: sleeve + turntable, tracklist, credits, metadata, listen and purchase options | one release, tracks, credits, links | 404 for unknown or unpublished slugs |
| `/artists` | Roster index | published artists | "Artist profiles arrive with the first release." |
| `/artists/[slug]` | Profile: name, bio, releases, socials | one artist + their releases + their links | 404 |
| `/shop` | Music and merchandise, routed to Shopify (external) and later Stripe Checkout (hosted) | verified product links | "The store opens soon"; no products shown |
| `/about` | Label story, founder story | site content `about` | Labelled placeholder until the founder's text is approved |
| `/contact` | Enquiry routes (bookings, press, collaboration, licensing) and socials | site content `contact`, `social` | "Contact details to follow"; no form until the contact workflow exists |
| `/dev/turntable` | Isolated turntable/scratch prototype | dev test signal | 404 unless dev fixtures are enabled |
| `/dev-fixtures/audio/[file]` | Synthesised test audio with byte-range support | none | 404 unless dev fixtures are enabled |

All public routes share one layout, so the audio element and player survive
navigation. Admin and sign-in stay in their separate root layout.

## Component architecture

```
app/(site)/layout.tsx            PlayerProvider ─ one HTMLAudioElement for the whole site
  SiteHeader (client: active link, menu)   SiteFooter (credit, socials, nav)
  MiniPlayer + PlayerOverlay     read/write the shared engine
  pages ─ server components that read src/server/content (published data only)

components/player/
  engine.ts        AudioEngine: queue, play/pause/seek/next/prev, volume, mute,
                   completion, loading/error, Media Session; owns the Web Audio graph
  scratch.ts       ScratchDeck: ring-buffer capture worklet, duck/pause, friction noise
  PlayerProvider   React context + useSyncExternalStore subscription
components/turntable/
  physics.ts       pure maths: pointer angle, unwrap, platter spin-up/spin-down, scratch rate
  Turntable.tsx    platter, label art, tonearm; pointer/touch/keyboard; drives engine
public/worklets/scratch-processor.js   AudioWorklet (capture + variable-rate playback)
server/content/
  types.ts, repository.ts (single read API), fixtures.ts (DEV FIXTURE data, gated)
```

## Turntable and scratching: how it works and its limits

- **Rotation** is computed every frame from playback state: 33⅓ rpm (200°/s)
  while playing, reaching speed in 0.5 s on play and braking to a stop in 0.8 s on pause. It is not a CSS loop. Under `prefers-reduced-motion` the platter does
  not spin by itself; dragging still works and stops dead on release.
- **Dragging**: pointer events cover mouse, pen and touch (`touch-action: none`
  on the platter only). The hand's angular velocity is measured continuously.
- **Deliberate scratch** starts only after the record moves more than 6°,
  so a tap is a play/pause toggle and a shaky finger is not a scratch.
- **Audio during a scratch**: the music element is faded out and paused. An
  AudioWorklet has been recording the last 8 seconds of what was playing, and
  plays that recording back at the hand's speed and direction (backwards
  included). This is real scrubbing of the actual track, limited to audio that
  has already played. You cannot scratch forward past the point where the needle
  was. A filtered-noise "vinyl friction" layer follows the hand speed.
- **Fallback**: if nothing has been recorded yet (record grabbed before
  playback, or after a seek), only the friction layer sounds. It is a sound
  effect, not scrubbing, and is labelled as such in code and docs.
- **Release**: playback resumes from where the hand left the record (position at
  grab + net rotation ÷ 200°/s, clamped to the track), with a 150 ms fade-in and
  the platter spinning back up.
- **Why not scrub the `<audio>` element directly**: `currentTime` seeks are
  asynchronous and click, and `playbackRate` cannot go negative (and Safari
  mutes extreme rates), so true back-and-forth scratching needs Web Audio.
- **Accessible alternative**: visible play/pause, previous/next and a seek
  slider beside the record. The platter is keyboard-focusable: Space/Enter toggles,
  ←/→ seek 5 s. State changes are announced in a live region.
- **Mobile Safari**: the AudioContext is created and resumed inside the first
  play gesture. Routing the element through Web Audio means iOS may pause
  playback when the screen locks; see decision 6. This can't be verified here
  (only Chromium is available in this environment); test on a real iPhone
  before launch.

## Data requirements (per release)

Required to publish: title, slug, format (single/EP/album), primary artist,
at least one track with title and position. Optional and shown only if present:
cover artwork, release date, description, catalogue number, UPC, credits,
per-track duration/ISRC, platform links (Apple Music, Spotify, …), Shopify
product URL, Stripe price reference, playable audio (full or preview).
Artists: name, slug, optional bio, portrait, social links.
Site content: homepage copy, featured release, about/founder text, contact
routes, social links, footer details.

Social links and Shopify/Stripe references must be editable in the admin.
They are stored server-side (`platform_links` and `site_content`); the admin
editors come with the content-management phase.

## Stripe (not implemented until confirmed)

Recommended: hosted **Stripe Checkout** created server-side from a stored Price
ID, test mode only until approval.

- Merchandise only: Checkout + Stripe's shipping-address collection; fulfilment
  handled by whoever ships the goods; webhook just records the order.
- Digital downloads: `checkout.session.completed` webhook (signature verified,
  idempotent on event ID) creates a purchase record; downloads are short-lived
  signed URLs issued only for a paid purchase record, with an expiry and a
  download count limit. The success-page redirect never grants access.
- Keys: `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` stay server-only; no
  publishable key is needed for hosted Checkout.

## Decisions needed from the client

1. **Stripe scope**: downloadable music, merchandise, or both? For downloads:
   file formats, how many downloads/how long. For merch: who ships, which
   countries, shipping rates. Currency, tax handling, refund policy.
2. **Shopify vs Stripe**: which products are sold where, so nothing is sold
   twice or priced differently.
3. **Content**: artist roster, bios, portraits, release titles, cover art,
   tracklists, credits, release dates, verified Apple Music/Shopify/other URLs,
   founder story, contact addresses per enquiry type, social handles.
4. **Audio rights**: which tracks may stream on the site, full or preview length,
   plus the licensed files.
5. **Brand**: the Jamaican-American references the label wants expressed
   (photography, type, colour accents, language). Not inferred by us.
6. **iOS trade-off**: keep Web Audio routing (scratching works; playback may
   pause on screen lock on iPhone) or route through Web Audio only while the
   turntable is on screen (more complex; first scratch uses the friction fallback).
7. **Contact**: a form (needs an email provider such as Resend, a recipient
   address and spam protection) or listed addresses only.
