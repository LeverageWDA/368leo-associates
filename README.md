# 368 Leoz Entertainment

Official website for 368 Leoz Entertainment. *Music is the voice.*

## Run locally

```bash
python3 -m http.server 3000
```

Then visit http://localhost:3000.

## Pages

| Page | File | What's on it |
|---|---|---|
| Home | `index.html` | Hero, featured release, listening room (first 6 tracks, "Show all"), video, links |
| Music | `music.html` | Every track in a scrolling list |
| Videos | `videos.html` | Music video(s) |
| Featured Artists | `artists.html` | One card per artist, built automatically from `catalog.js` |
| About | `about.html` | The story, plus rights and credits |
| Contact | `contact.html` | Email, Instagram, TikTok and a message form (opens the visitor's email app) |

Moving between pages doesn't reload the site (`router.js`), so a song keeps playing.
The header, footer and players are the same on every page: if you change them, change all five files.

After changing `styles.css` or any `.js` file, change the `?v=...` number on their links in all five pages
(for example `?v=20261109b` to `?v=20261110a`), so visitors' browsers fetch the new version instead of an old saved copy.
`catalog.js` has the same number, so bump it after adding songs too.

## Adding songs, cover art and the music video

1. Copy the files into the `media` folder:
   - `media/audio/`: songs (`.mp3` or `.m4a`)
   - `media/covers/`: cover art (`.jpg` or `.png`, square works best)
   - `media/video/`: the music video (`.mp4`). A YouTube link can be used instead.
   - Files can also live in Cloudflare R2: use their full public links in `catalog.js`.
2. Open `catalog.js` and list them. File names must match exactly, including capital letters.
3. Reload the page. The tracklist, player, release sleeve and video update automatically.
   Anything left empty shows a "coming soon" state.

Use web-sized files, not masters: about 128–192 kbps MP3 for audio and a 1080p MP4 under ~100 MB for video.

## Listening without downloading

Visitors can play music on the site, but the site offers no way to download it:

- no download buttons and no links to the audio files
- the audio plays through a hidden player with the browser's own controls turned off
- the video player has its download, picture-in-picture and casting options turned off
- right-click and drag-to-save are blocked on the players and artwork
- `robots.txt` and the `vercel.json` headers keep `/media/` out of search engines

**Limits:** these measures stop casual downloading only. Anything a browser can play can be
captured by someone determined (for example by recording the sound, or using developer
tools to find the file address). To protect masters, only upload web-quality versions, or use
a short preview clip. For stronger protection, stream through a service with signed, expiring
links (for example Mux or Cloudflare Stream) or embed from YouTube, SoundCloud or Audiomack.

## Social links

Instagram, TikTok, YouTube, Spotify and the email address live in the `social` section at the top of `catalog.js`.
They appear as icons in every footer and as cards on the Contact page. Leave a link empty (`""`) to hide it,
for example Spotify until there is a page to link to. The icons come from the Simple Icons library on jsDelivr;
if they can't load, the buttons show IG / TT / YT / SP instead.

## Link previews and icons

- `favicon.ico`, `assets/brand/icon-192.png`, `icon-512.png` and `apple-touch-icon.png` are the browser and phone icons.
- `assets/brand/og-image.jpg` (1200×630) is the picture shown when the link is shared on WhatsApp, Instagram, Facebook, X and iMessage.
  Share apps need a full web address for it, so the pages point to the copy in Cloudflare R2:
  `https://pub-e6ebba16f5a8490e8e3bc21eb67db275.r2.dev/brand/og-image.jpg`. If you change the image, upload the new one to the same place.

## Rights

The riddims belong to 368 Leoz Entertainment. The artists are independent and only voiced on those riddims, so the site
says so on the Featured Artists and About pages and in every footer. Keep written permission from each artist to stream
their song on this site.

## Brand

- Logo files are in `assets/brand/`:
  - `368leoz-logo.png`: full logo for light backgrounds
  - `368leoz-logo-on-dark.png`: brightened version for dark backgrounds
  - `368leoz-crest.png` and `368leoz-crest-on-dark.png`: crest only
  - `favicon.png` and `apple-touch-icon.png`: browser icons
- Colours: light `#f7f6f2`, ink `#111110`, gold `#d4af37`, bright gold `#ffd700`.
- Type: Space Grotesk (display), Instrument Serif italic (accents), DM Sans (body), DM Mono (labels).
  Fonts are self-hosted in `fonts/`.

## Still to supply

1. Songs, cover art and the music video (see above).
2. Apple Music and store links.
3. The approved "About" text, social links and contact email.
