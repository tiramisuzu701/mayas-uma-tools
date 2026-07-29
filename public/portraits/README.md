# Adding character portraits

Portraits come from three sources, tried in this order for each character:

1. **A file you add to this folder** (always wins if present).
2. **A hotlinked image** from `src/data/portraitUrls.js` - all 95 built-in
   characters currently have one of these wired up.
3. **A generated initials avatar** - the fallback if a hotlinked image
   ever fails to load, or for a custom ("not listed") uma that has no
   built-in id to match against.

This folder itself ships empty (and stays empty in git - see
`.gitignore`), so the public repo doesn't include any locally-added files.

## Adding your own image locally

Add an image file named after the character's id, for example:

```
public/portraits/special-week.png
public/portraits/silence-suzuka.png
public/portraits/gold-ship.jpg
```

Open `src/data/characters.js` to find a character's `id` - each entry
looks like `{ id: 'special-week', name: 'Special Week' }`. Use that `id`
as the filename (`.png`, `.jpg`, or `.webp` all work; the app tries
`.png` first, so that's the safest choice).

These files are for your own local/personal use and are intentionally
excluded from git via `.gitignore`, so pushing to GitHub won't publish
them.

## About the built-in hotlinked portraits

`src/data/portraitUrls.js` maps every built-in character's id to a full
portrait image URL hosted on **GameTora's global (English) Uma Musume
database** (`gametora.com/umamusume` - not their Japanese or Korean
version). These URLs, along with the character list and base aptitude
grades, come from a spreadsheet that's filled in and maintained by hand
(see the main `README.md`'s "Character data" section) rather than being
auto-generated. Nothing is downloaded or stored in this repo: your
browser fetches the image directly from the source CDN at the URL listed
there, the same way any website can embed an image by linking to it.

To add a new character later, or update an existing one's portrait:

1. Go to `https://gametora.com/umamusume/characters` and open the
   character's page (make sure the URL is under `gametora.com/umamusume`,
   the global site).
2. Copy the full image URL for whichever art you want to use.
3. Add or update the entry for that character's id in the
   `PORTRAIT_URLS` object in `src/data/portraitUrls.js`.

If GameTora is ever unreachable, or an image fails to load, everyone
just falls back to their initials avatar automatically - nothing breaks.

## Notes

- Square images work best when the avatar is rendered small/circular;
  larger full-body art still displays fine, just cropped to the circle.
- If you add a custom character (via "Custom / not listed" in the roster
  form), there's no built-in id to match against, so it always uses the
  initials placeholder.
