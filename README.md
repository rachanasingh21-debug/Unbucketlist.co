# Unbucketlist.co

Static site served by Firebase Hosting (`public/`).

## Deploy (one time, ~2 minutes)

```bash
npm i -g firebase-tools
firebase login                      # opens Google sign-in with your account
firebase projects:create unbucketlist-co --display-name "Unbucketlist"   # pick any free project ID
firebase use unbucketlist-co
firebase deploy --only hosting      # prints https://unbucketlist-co.web.app
```

Preview locally: `firebase emulators:start --only hosting` (or open `public/index.html`).

## Adding real photos / video
Edit the `TRIPS` array at the top of `public/app.js`: set `image` and/or `video`
(e.g. `/media/bali.mp4`, files placed in `public/media/`). They replace the illustrated placeholder everywhere
(cards, reels, itinerary hero).

## Story banners, facts and photos
- `public/facts.js`: the facts and pull-quote shown in each destination's story banner. Edit freely.
- `public/media/`: destination photos from Wikimedia Commons (CC BY / CC BY-SA / public domain).
  `credits.json` holds each photo's author, licence and source page, plus a caption; `photos.js` is generated from it.
  The banners show the credits automatically. Keep them if you keep the photos (the licences require attribution).
- Replace any photo with your own by overwriting the file (same name) and updating its entry in `credits.json` / `photos.js`.
