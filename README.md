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
