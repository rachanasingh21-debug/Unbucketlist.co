// Payments for unbucketlist.co: Firebase Cloud Functions (2nd gen) in Mumbai, talking to Razorpay.
//   createOrder     the website sends the booking; we check it, work out the price, create a Razorpay order, save the booking
//   verifyPayment   after Razorpay's window succeeds; we check Razorpay's signature and mark the booking paid
//   razorpayWebhook Razorpay tells us directly (covers a visitor who closes the page before verifyPayment)
// Bookings are stored in Firestore, collection "bookings" (not readable from the website; see firestore.rules).
// Setup and go-live steps: docs/payments.md
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');
const core = require('./core');

admin.initializeApp();
const db = () => admin.firestore();
const now = () => admin.firestore.FieldValue.serverTimestamp();

const KEY_ID = defineSecret('RAZORPAY_KEY_ID');
const KEY_SECRET = defineSecret('RAZORPAY_KEY_SECRET');
const WEBHOOK_SECRET = defineSecret('RAZORPAY_WEBHOOK_SECRET');

const DATA = core.load();
const SITE = {
  region: 'asia-south1',
  cors: ['https://unbucketlist-co.web.app', 'https://unbucketlist-co.firebaseapp.com', 'https://unbucketlist.co', 'https://www.unbucketlist.co'],
  maxInstances: 10,
};

async function razorpay(path, body) {
  const auth = Buffer.from(`${KEY_ID.value()}:${KEY_SECRET.value()}`).toString('base64');
  const r = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Basic ${auth}` }, body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { logger.error('Razorpay error', { status: r.status, error: j.error }); throw new Error('payment provider error'); }
  return j;
}

exports.createOrder = onRequest({ ...SITE, secrets: [KEY_ID, KEY_SECRET] }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  let b;
  try { b = core.validate(req.body, DATA); } catch (e) {
    if (e instanceof core.BadRequest) return res.status(400).json({ error: e.message });
    throw e;
  }
  try {
    const ref = db().collection('bookings').doc();
    const order = await razorpay('orders', {
      amount: b.quote.now * 100, currency: 'INR', receipt: ref.id,   // amount in paise
      notes: { bookingId: ref.id, place: b.place, way: b.offerName, boarding: b.start, travellers: String(b.pax) },
    });
    await ref.set({ ...b, status: 'awaiting_payment', orderId: order.id, amountDue: b.quote.now, createdAt: now() });
    res.json({ bookingId: ref.id, orderId: order.id, amount: order.amount, currency: order.currency, keyId: KEY_ID.value(), quote: b.quote });
  } catch (e) {
    logger.error('createOrder failed', e);
    res.status(502).json({ error: 'We could not start the payment just now. Nothing was charged. Please try again in a minute.' });
  }
});

exports.verifyPayment = onRequest({ ...SITE, secrets: [KEY_SECRET] }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  const { bookingId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body || {};
  if (!bookingId || !orderId || !paymentId || !signature) return res.status(400).json({ error: 'Missing payment details.' });
  const ref = db().collection('bookings').doc(String(bookingId));
  const snap = await ref.get();
  if (!snap.exists) return res.status(404).json({ error: 'We could not find that booking.' });
  const bk = snap.data();
  if (bk.orderId !== orderId || !core.paymentSignatureOk(orderId, paymentId, signature, KEY_SECRET.value())) {
    logger.warn('payment signature did not match', { bookingId });
    return res.status(400).json({ error: 'We could not verify this payment.' });
  }
  const status = core.paidStatus(bk.quote);
  if (bk.status === 'awaiting_payment') await ref.update({ status, paymentId, amountPaid: bk.quote.now, paidAt: now(), confirmedBy: 'checkout' });
  res.json({ ok: true, status });
});

exports.razorpayWebhook = onRequest({ region: 'asia-south1', secrets: [WEBHOOK_SECRET] }, async (req, res) => {
  if (!core.webhookSignatureOk(req.rawBody, req.get('x-razorpay-signature'), WEBHOOK_SECRET.value())) return res.status(400).send('bad signature');
  const ev = req.body || {};
  const pay = ev.payload && ev.payload.payment && ev.payload.payment.entity;
  if (!pay || !pay.order_id) return res.status(200).send('ignored');
  const q = await db().collection('bookings').where('orderId', '==', pay.order_id).limit(1).get();
  if (q.empty) return res.status(200).send('no booking');
  const ref = q.docs[0].ref, bk = q.docs[0].data();
  if ((ev.event === 'payment.captured' || ev.event === 'order.paid') && bk.status === 'awaiting_payment') {
    await ref.update({ status: core.paidStatus(bk.quote), paymentId: pay.id, amountPaid: pay.amount / 100, paidAt: now(), confirmedBy: 'webhook' });
  } else if (ev.event === 'payment.failed') {
    await ref.update({ lastPaymentError: (pay.error_description || 'failed').slice(0, 300), lastPaymentErrorAt: now() });
  }
  res.status(200).send('ok');
});
