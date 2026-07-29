# Maya's Uma Tools

A small, personal resource site for **Uma Musume: Pretty Derby**. Everything
runs entirely in your browser - there's no backend, database, or login (yet).
Your data (like your trained uma roster) is stored only in your own
browser's `localStorage`, on your own device.

This is an unofficial fan project. Uma Musume: Pretty Derby and all related
character names/art belong to Cygames, Inc.

## Tools

- **Team Trials Builder** - log the stats and aptitude grades of umas you've
  actually trained, then get help building your squad of 15: an Ace plus two
  additional runners for each of the Sprint / Mile / Medium / Long / Dirt
  race categories. Includes:
  - An animated popup character picker (with a search box and a hover
    preview of stats/aptitudes) everywhere you'd otherwise see a plain
    dropdown, whether you're picking a built-in character or assigning a
    roster member to a race slot.
  - Base aptitude grades that auto-fill when you pick a built-in character,
    which you can then adjust to match your actual trained result.
  - An auto-fill button that finds the optimal 15-uma assignment for your
    whole roster (and a second one that only fills whatever's still empty,
    without disturbing picks you've already made).
  - Running-style-overlap warnings scoped to each individual race (the 3
    teammates fielded together), since that's when style interference
    actually matters.
- **Support Card Tier List & Deck Builder** - build a 6-card support deck and
  see a live, scored tier list of every support card, ranked by how much
  each one would actually improve *that* deck for the race distances,
  running styles, training scenario, mood, and optional-race count you pick.
  Clicking a card in the tier list adds it to your deck (a higher limit
  break of a card already in your deck swaps it in; a card sharing a
  character with one already in your deck is blocked, same as the original
  tool this was ported from). See "Support Card Tier List credit & license"
  below - this tool's scoring engine and card data were ported from another
  open-source project, not written from scratch. Also includes:
  - A **My Collection** tab for marking which cards you actually own (and
    at what limit break), with an "owned only" filter on the tier board,
    plus an export code/JSON download and an import box for backing up or
    moving your collection between browsers.
  - **Filters** on the tier board (per-rarity limit break, hint type, "owned
    only") and a substat display selector (up to 4 support-effect values
    shown as badges on each card - display only, doesn't affect scores).
  - **Hover/tap tooltips** on each card showing its hint-match rate, hint
    types, any gold (rare) skill hints, and its exact stat contribution to
    your current deck.
  - A **blue sparks** selector (up to 6 stat + star-rank slots) and a
    **manual training-distribution override**, both feeding into the same
    scoring engine as the rest of the tool.
- More tools planned - see the "coming soon" cards on the home page.

## Light / dark mode

The site defaults to a dark, gacha-game-inspired theme, with a toggle
(top-right, next to the GitHub link) to switch to a light theme instead.
Your choice is remembered in `localStorage` on your own device. See
`src/lib/theme.js` and the `[data-theme='light']` block in `src/index.css`
if you want to tweak the palette.

## Running it locally

You'll need [Node.js](https://nodejs.org/) 20 or later.

```bash
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`).

To build a production version (outputs to `dist/`):

```bash
npm run build
npm run preview   # optional: serve the built version locally to double check it
```

## Deploying to GitHub Pages

This repo includes a GitHub Actions workflow
(`.github/workflows/deploy.yml`) that builds the site and publishes it to
GitHub Pages automatically every time you push to `main`.

One-time setup after you push this repo to GitHub:

1. Go to your repo's **Settings → Pages**.
2. Under "Build and deployment", set **Source** to **GitHub Actions**.
   (Leaving it on the default "Deploy from a branch" will serve the raw,
   unbuilt `index.html` and show a blank page.)
3. Push to `main` (or go to the **Actions** tab and run the "Deploy to
   GitHub Pages" workflow manually).
4. After it finishes, your site will be live at
   `https://<your-username>.github.io/<repo-name>/`.

The app uses a relative build path and hash-based routing
(`/#/team-trials`), so it works correctly regardless of what you name the
repo - no extra Pages configuration needed.

## Character data (names, aptitudes, portraits)

All 95 built-in characters' names, base aptitude grades (turf/dirt,
distances, running styles), and portrait art all come from a spreadsheet
that's filled in and maintained by hand, rather than auto-generated -
earlier auto-generated data turned out to be unreliable, so this is now
the source of truth. See `src/data/characters.js` (id/name),
`src/data/baseAptitudes.js` (base aptitude grades), and
`src/data/portraitUrls.js` (portrait URL), all keyed by the same
character `id`.

Portraits are **hotlinked**, not downloaded or committed to this repo:
each portrait URL points at an image on
[GameTora's global (English) Uma Musume database](https://gametora.com/umamusume/characters)
(never the JP/KR versions), and your browser fetches it directly from
that CDN, the same way any site can embed an image by linking to it. If a
hotlinked image ever fails to load (or for a custom, not-listed uma), the
site falls back to a clean generated initials avatar so something always
shows. See `public/portraits/README.md` for how to override any portrait
with a local image file instead.

## Project structure

```
src/
  data/           game/domain reference data (character list, base aptitudes, portrait URLs, race categories, grades)
  lib/            plain JS logic: localStorage persistence, scoring, the team-assignment algorithm, theme handling
  components/     small shared UI pieces (Avatar, SupportCardArt, GradeBadge, AnimatedPicker, PickerField, Modal, ToolCard, ...)
  pages/          one folder/file per page
    Home.jsx
    TeamTrialsBuilder/    roster manager + team builder sub-views
    SupportCardBuilder/   deck builder page, tier board, and the ported scoring engine:
      engine/             TypeScript scoring engine ported from Tachyon's Lab (classes/, config/, types/, utils/)
      data/               supportCards.json - the card database that engine runs against
      engineBridge.js     the only file that imports the engine directly; everything else goes through it
      storage.js          localStorage persistence for your owned-card collection + blue sparks, plus the
                          collection import/export-code logic
      CollectionManager.jsx, BlueSparksSelector.jsx, TrainingDistributionSelector.jsx, CardTooltip.jsx
```

To add a new tool later: create a new folder under `src/pages/`, add a
route for it in `src/App.jsx`, and add a card for it on `src/pages/Home.jsx`.

## Support Card Tier List credit & license

The Support Card Tier List & Deck Builder's scoring engine (the code that
simulates a training career turn-by-turn to score support cards) and its
card database are ported from
[**Tachyon's Lab**](https://github.com/Jechto/Tachyons-lab) by **Jechto**,
licensed under GPL-3.0, and used here with the original author's
permission. The engine (`src/pages/SupportCardBuilder/engine/`) and card
data (`src/pages/SupportCardBuilder/data/supportCards.json`) were ported
faithfully (bug-for-bug, including a few known scoring quirks in the
original) rather than rewritten; the surrounding page/UI is new. Support
card art is hotlinked from GameTora's Uma Musume database, the same way
character portraits are elsewhere on this site (see "Character data"
above) - not downloaded or committed to this repo.

Because this repo now incorporates GPL-3.0-licensed code, the whole
project is licensed under the GNU General Public License v3.0 - see
[`LICENSE`](./LICENSE).

Your owned-card collection and equipped blue sparks are stored only in
your own browser's `localStorage`, same as everything else on this site -
use the collection manager's export code/JSON download if you want a
backup or want to move your collection to a different browser or device.

## A note on the Team Trials numbers

The stat thresholds and scoring used to rank/auto-assign your roster (things
like "Speed 1000+" or "Stamina ~1100 for Long races") are rough community
guidelines gathered from player guides, not official numbers published by
Cygames - treat the auto-fill and warnings as a helpful starting point, not
gospel, especially as the game's meta shifts over time. You can see/tweak
these in `src/data/constants.js`.
