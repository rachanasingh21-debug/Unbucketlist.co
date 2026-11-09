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
- `public/vendor/globe.gl.min.js` and `public/img/`: self-hosted 3D globe library and Earth textures.
