// Booking and payment rules, with no Firebase and no network, so they can be tested on their own (npm test).
// Prices and the deposit/GST rules come from the website's own files (offers.js, pay-config.js), copied here at deploy time,
// so the server always charges exactly what the customer was shown, and never trusts an amount sent by the browser.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

function load(dir = __dirname) {
  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const f of ['offers.js', 'pay-config.js']) {
    vm.runInContext(fs.readFileSync(path.join(dir, f), 'utf8'), ctx, { filename: f });
  }
  return { OFFERS: ctx.window.OFFERS, PAY: ctx.window.PAY };
}

class BadRequest extends Error {}
const bad = m => new BadRequest(m);
const DAY = 864e5;

// Checks a booking sent by the website and works out the price on the server.
function validate(body, { OFFERS, PAY }, today = new Date()) {
  const b = body || {};
  const place = String(b.place || '');
  const list = Object.prototype.hasOwnProperty.call(OFFERS, place) ? OFFERS[place] : null;
  if (!list) throw bad('We could not find that place.');
  const offer = Number(b.offer);
  if (!Number.isInteger(offer) || !list[offer]) throw bad('We could not find that way to unbucket it.');
  const pax = Number(b.pax);
  if (!Number.isInteger(pax) || pax < 1 || pax > 8) throw bad('Travellers must be between 1 and 8.');
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(b.start || ''));
  if (!m) throw bad('Pick a boarding date.');
  const start = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const today0 = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (start < today0 + 13 * DAY) throw bad('Pick a boarding date at least two weeks from today.');   // 13: a day of slack for time zones
  if (start > today0 + 550 * DAY) throw bad('Pick a boarding date within the next 18 months.');
  const name = String(b.name || '').trim().slice(0, 120);
  const email = String(b.email || '').trim().slice(0, 200);
  if (!name) throw bad('Add your name so we know who is travelling.');
  if (!/^\S+@\S+\.\S+$/.test(email)) throw bad('Add an email address we can reply to.');
  const of = list[offer];
  const quote = { ...PAY.quote(of.price, pax) };   // a plain object of this realm (Firestore refuses objects made inside the vm)
  if (!(quote.now > 0)) throw bad('This trip has no price yet.');
  const end = new Date(start + (of.days - 1) * DAY).toISOString().slice(0, 10);
  return { place, offer, offerName: of.name, days: of.days, pricePerPerson: of.price, pax, start: m[0], end, name, email, quote,
    charge: PAY.charge, depositPct: PAY.depositPct, gstPct: PAY.gstPct || 0 };
}

const safeEqual = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };
// Razorpay Checkout: signature = HMAC-SHA256(order_id + "|" + payment_id, key_secret), hex
const paymentSignatureOk = (orderId, paymentId, signature, secret) =>
  !!(orderId && paymentId && signature && secret) && safeEqual(crypto.createHmac('sha256', secret).update(orderId + '|' + paymentId).digest('hex'), signature);
// Razorpay webhooks: X-Razorpay-Signature = HMAC-SHA256(raw request body, webhook secret), hex
const webhookSignatureOk = (rawBody, signature, secret) =>
  !!(rawBody && signature && secret) && safeEqual(crypto.createHmac('sha256', secret).update(rawBody).digest('hex'), signature);

// 'deposit_paid' while something is still due, 'paid' once it is all in
const paidStatus = quote => (quote.later > 0 ? 'deposit_paid' : 'paid');

module.exports = { load, validate, BadRequest, paymentSignatureOk, webhookSignatureOk, paidStatus };
