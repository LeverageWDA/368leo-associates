# Leo & Associates — Frontend Concept

A custom, mobile-first music-label frontend. **Concept only:** no invented artists, release names, credits, audio, or working purchase URLs.

## Run locally

Requires Node.js 20.9 or newer (22 LTS recommended). No credentials are needed
for the public site.

```bash
npm install
npm run dev
```

Then visit http://localhost:3000. The admin area (`/admin`) stays locked (503)
until Supabase and Clerk are configured; see `docs/setup.md`.

The original static prototype is kept in `prototype/` for reference
(`cd prototype && python3 -m http.server 3001`).

## Design system

- **Color:** light `#f7f6f2`, ink `#111110`, gold `#d4af37`, bright gold `#ffd700`. `--gold-deep` is for display-size gold on light, `--gold-text` for small gold text (AA).
- **Type:** Space Grotesk (display), Instrument Serif italic (accents), DM Sans (body), DM Mono (metadata/labels).
- **Objects:** a shared `.disc` record component (static grooves, spinning label) appears in the hero, the release sleeve and the player overlay.

## Motion & interaction

- Masked line reveals on every display headline; fade-up on supporting blocks
- Hero record parallax; release record slides out of its sleeve with scroll
- Marquee speeds up with scroll velocity; nav auto-hides on scroll down, with a gold progress line
- Listening room: ambient "nebula" glow that drifts and follows the pointer; breathing orb with orbit
- Fill-wipe buttons, magnetic hero button, platform rows with gold sweep (labelled LINK PENDING)
- Mini player parks itself while the footer is visible
- All motion is disabled under `prefers-reduced-motion`

## Placeholders still to replace

1. Official EP cover art (`.release-art`) and tracklist.
2. Licensed audio for the player overlay.
3. Verified Apple Music and Shopify URLs (platform rows are deliberately not links yet).
4. The founder-approved label introduction and contact details.

Fonts load from Google Fonts; system fallbacks are provided.
