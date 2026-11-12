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
  height tints, latitude-aware snowline, NW sun). Current look: **relief**, matched to the client's reference (Kuzeyoku "Relief Style World
  Map (Flat Ocean)" wall maps): seafoam sea with soft sea-floor relief, olive/sage lowlands, sand deserts, tan uplands, taupe plateaus, white ice,
  crisp low-sun hillshade, land casting a teal shadow onto the sea, atlas lettering (continents in spaced caps, seas in italics).
  Earlier looks (vivid, satellite) are in git history; `LOOKS.satellite` / `LOOKS.vivid` stay defined in map.js. Only `public/data/looks/relief/`
  ships. Rebuild with `python3 tools/build_relief.py relief` (needs tools/mapdata.json next to it).
  Rebuild with `tools/build_relief.py` (see `tools/README.md`). The user asked for a natural, Google-Earth-like feel: no drawn triangle mountains/trees.
  Each destination's journey (stops with day notes and kind) and lakes/patches are in `public/routes.js`.
  Flow (rebuilt after a phone walkthrough): hero with a dark scrim -> tap a place -> fly in -> arrival title -> journey draws -> slim place bar
  (opens into a sheet). One pop-up design (`#mapPop`) pinned to its map spot: stops (with Prev/Next to walk the journey) and wild things.
  Breadcrumb "World > Place" exits. + / - zoom towards the place. Never name a state class `sheet` on the map: `.sheet` is the destination page.
- Brand vocabulary (use everywhere): BUCKET LIST = saved places ("My bucket list", "+ My bucket list"), UNBUCKET = book / go
  ("Unbucket this for me"), and the four things a place gives you: GO (stops), TASTE (food), EXPLORE (wild things), TAKE AWAY (keepsakes, feelings).
  `public/bucket.js` holds TASTE and TAKE AWAY per place (tied to stop names) and time zones. No "wishlist", "save", "itinerary", hearts.
- Header pill opens the place finder (`#finder`); the bucket icon opens "My bucket list" in the same panel.
- `public/wildlife.js`: 3-5 real wildlife spots per destination (EXPLORE): dots that bloom into badges as you zoom in; tap for the story.
- `public/offers.js`: 2-3 offerings per destination, shown on the destination page and in the booking form.
- Destination pages are a full-screen overlay routed by hash (`#ladakh`).
- Map layering (map.js render): relief layers with a soft land shadow, a small plane flying between places, birds, noise-generated clouds (cumulus + high wisps with parallax) with soft shadows, sun shimmer on the sea,
  warm light / haze / vignette, tilt-shift blur at top and bottom when zoomed into a place. Lakes are soft-edged, not outlined.
- Caching: firebase.json sends `no-cache` for html/js/css/json and `data/**` so phones always revalidate. Bump the `?v=` on script/style tags in
  index.html when shipping big changes (old copies were cached for an hour before this rule).
- Booking form is a preview: it does not send or store anything yet (no backend chosen).
