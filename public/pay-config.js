/* Payments: the switch and the pricing rules, in one place.
   The site AND the server (functions/) both read this file, so what the customer sees is exactly what they are charged.
   While `on` is false the booking form stays a request (no payment). To go live, follow docs/payments.md.
   Only the PUBLIC Razorpay key id ever goes here; the secret key lives in Firebase secrets, never in the website. */
window.PAY = {
  on: false,                 // flip to true once the Razorpay account and the server functions are live
  provider: 'razorpay',
  keyId: '',                 // rzp_test_… while testing, then rzp_live_…
  api: '',                   // where the server functions answer, e.g. '/api' (Hosting rewrites) or 'https://asia-south1-unbucketlist-co.cloudfunctions.net'
  business: 'Unbucketlist',  // the name shown in the Razorpay payment window
  charge: 'deposit',         // 'deposit' = a share now, the rest before travel; 'full' = everything now
  depositPct: 25,            // used when charge is 'deposit'
  balanceDueDays: 30,        // the rest is due this many days before boarding
  gstPct: 0,                 // GST on the package, e.g. 5. Confirm the right rate (and any TCS on overseas trips) with your CA. 0 hides the line.
};

/* The price of a trip, in whole rupees: per-person price x travellers, plus GST, then what is paid now and later. */
window.PAY.quote = function (pricePerPerson, pax) {
  const P = window.PAY;
  const trip = pricePerPerson * pax;
  const gst = Math.round(trip * (P.gstPct || 0) / 100);
  const total = trip + gst;
  const now = P.charge === 'full' ? total : Math.round(total * (P.depositPct || 25) / 100);
  return { trip, gst, total, now, later: total - now };
};
