# Payments (Razorpay): how it works and how to switch it on

Payments are **built but switched off**. While `on: false` in `public/pay-config.js`, the booking form works exactly as before
(a request preview, nothing charged, nothing stored).

## How a payment works

1. The visitor fills in the booking form. The form shows the trip total, GST (if set), the deposit to pay now and what is due later.
2. **Pay** asks our server (`createOrder`) for an order. The server checks the booking and **works out the price itself** from
   `offers.js` and `pay-config.js` (the browser's numbers are never trusted), creates a Razorpay order, and saves the booking in
   Firestore (`bookings`, status `awaiting_payment`).
3. Razorpay's own window opens (UPI, cards, netbanking, wallets). Card details never touch our site.
4. On success the server (`verifyPayment`) checks Razorpay's signature and marks the booking `deposit_paid` (or `paid`).
   The departure board then flips to **DEPOSIT PAID** with the payment reference.
5. Razorpay also calls our webhook (`razorpayWebhook`), so a booking is marked paid even if the visitor closes the page early.

If the visitor closes the window: "Payment cancelled. Nothing was charged." If the bank declines: the bank's reason.
If the money went through but our check failed: the reference is shown and the Pay button stays locked (no double payment).

| Piece | File |
|---|---|
| Switch + pricing rules (deposit %, GST %, balance due days) | `public/pay-config.js` (read by the site **and** the server) |
| Checkout on the site | `public/pay.js`, booking form in `public/app.js` |
| Server (Cloud Functions, Mumbai `asia-south1`) | `functions/index.js`, rules in `functions/core.js` |
| Checks (prices, refusals, signatures) | `cd functions && npm test` |
| Database rules (nothing readable from the website) | `firestore.rules` |

## Before you can take money (business side)

- [ ] **Razorpay account + KYC**: business PAN, bank account, GSTIN if registered, business proof.
- [ ] **Pages Razorpay checks on the website** (and customers expect): Contact us (legal name, address, phone, email),
      Terms & conditions, Privacy policy, Cancellation & refund policy, and a delivery/service policy (how and when the trip is delivered).
      Send the business details and the cancellation rules and these pages can be added in the site's style.
- [ ] **Real prices and itineraries**: the trips, prices and day plans on the site are sample content. Confirm each one before charging.
- [ ] **Decide**: deposit or full payment, deposit %, GST rate on packages, TCS on overseas packages, and when the balance is due.
      Check GST and TCS with your CA, then set them in `pay-config.js`.
- [ ] **Balance payments**: for now, send the balance as a Razorpay Payment Link from the dashboard (the booking shows what is due).

## Switching it on (technical, about 30 minutes)

1. **Firebase Blaze plan** (pay-as-you-go; Cloud Functions and secrets need it). Firebase console → Usage and billing.
2. **Create the Firestore database**: Firebase console → Firestore → Create database → production mode → `asia-south1` (Mumbai).
3. **Razorpay test keys**: Razorpay Dashboard → Account & Settings → API Keys (Test mode). Make sure payments are auto-captured
   (Account & Settings → Payment capture).
4. **Store the secrets** (never in the website):
   ```
   firebase functions:secrets:set RAZORPAY_KEY_ID
   firebase functions:secrets:set RAZORPAY_KEY_SECRET
   firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET   # any long random string; reuse it in step 6
   ```
5. **Deploy the server**:
   ```
   cd functions && npm install && npm test && cd ..
   firebase deploy --only functions,firestore:rules
   ```
6. **Webhook**: Razorpay Dashboard → Webhooks → Add: URL
   `https://asia-south1-unbucketlist-co.cloudfunctions.net/razorpayWebhook`, events `payment.captured`, `order.paid`,
   `payment.failed`, secret = the `RAZORPAY_WEBHOOK_SECRET` from step 4.
7. **Point the site at it** in `public/pay-config.js`:
   ```js
   on: true,
   keyId: 'rzp_test_…',                                         // the public key id only
   api: 'https://asia-south1-unbucketlist-co.cloudfunctions.net',
   ```
   Then bump `?v=` in index.html and `firebase deploy --only hosting`.
8. **Test** with Razorpay's test cards / test UPI (no real money). Check the booking appears in Firestore → `bookings` as `deposit_paid`.
9. **Go live**: generate live keys, re-run step 4 with them, set `keyId: 'rzp_live_…'`, add the live webhook (step 6), redeploy functions and hosting.

If the custom domain changes, add it to `cors` in `functions/index.js` (unbucketlist.co and www are already listed).

## Not built yet

- An email/WhatsApp message to you (and the traveller) for each booking. Firestore has everything; a notifier can be added on top.
- A screen to see and manage bookings (use the Firebase console → Firestore → `bookings` for now).
- Requests without payment are still not stored (when payments are on, every booking goes through payment).
- Refunds and balance payments from the site (done from the Razorpay dashboard for now).
