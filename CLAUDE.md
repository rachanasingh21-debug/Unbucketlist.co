# Unbucketlist.co

Static travel site on Firebase Hosting. Files served from `public/` (no build step).

## Standing rule: deploy after every major change

After every major change (a new section, feature, design change, or new content/photos),
commit, push, and **deploy to Firebase Hosting** without waiting to be asked:

1. Check the change locally first (serve `public/` over HTTP, e.g. `python3 -m http.server`, and load it in a browser; no console errors).
2. Commit and push to the working branch.
3. Deploy: `firebase deploy --only hosting` (or the Firebase MCP `firebase_deploy` tool with `only: "hosting"`), then confirm the deploy finished successfully.
4. Tell the user it is live at https://unbucketlist-co.web.app.

Small fixes (typos, one-line tweaks) can be batched into the next deploy.

## Project facts
- Firebase project / hosting site: `unbucketlist-co` (owner account: the user's Google account). Config in `firebase.json` and `.firebaserc`.
- `public/app.js`: trips data (`TRIPS`, `CAL` = first-12-months calendar), globe, reels, story banners, itinerary drawer.
- `public/facts.js`: facts and pull-quotes per destination for the story banners.
- `public/media/`: Wikimedia Commons photos; `credits.json` is the source of truth, regenerate `photos.js` from it. Keep photo credits (licences require attribution).
- Front page hero is an illustrated, zoomable flat map (`public/map.js`, canvas). No globe, no satellite data, no month strip, no photo pins (the user rejected those).
  Coastlines: Natural Earth via world-atlas, pre-converted to `public/data/land-110.json`, `land-50.json`, `land-detail.json` (10m, clipped around each destination).
  Natural look: relief layers built from open elevation data (AWS Terrain Tiles) with designed colours (climate-style greenness, region tints,
  height tints, latitude-aware snowline, NW sun): `public/data/world-ocean.jpg`, `world-land-1k/3k.jpg`, `relief-<id>.webp` (+ `relief.json` boxes).
  Rebuild with `tools/build_relief.py` (see `tools/README.md`). The user asked for a natural, Google-Earth-like feel: no drawn triangle mountains/trees.
  Each destination's journey (stops with day notes and kind) and lakes/patches are in `public/routes.js`.
  Zooming into a place: clouds, then its terrain, then the route as a constellation of stars. A card offers "Unbucket this for me" / "Explore".
- `public/offers.js`: 2-3 offerings per destination, shown on the destination page and in the booking form.
- Destination pages are a full-screen overlay routed by hash (`#ladakh`).
- Booking form is a preview: it does not send or store anything yet (no backend chosen).
