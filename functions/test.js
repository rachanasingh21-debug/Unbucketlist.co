// npm test: checks the booking rules and Razorpay signature checks without Firebase or the internet.
const assert = require('assert');
const path = require('path');
const crypto = require('crypto');
const core = require('./core');

const data = core.load(path.join(__dirname, '..', 'public'));   // the website's own files
const today = new Date(Date.UTC(2026, 10, 26));
const ok = { place: 'ladakh', offer: 0, pax: 2, start: '2027-06-01', name: 'Asha Rao', email: 'asha@example.com' };

// the price comes from the server's copy of the offers, whatever the browser says
const b = core.validate({ ...ok, amount: 1 }, data, today);
assert.strictEqual(b.pricePerPerson, data.OFFERS.ladakh[0].price);
assert.deepStrictEqual(b.quote, { ...data.PAY.quote(data.OFFERS.ladakh[0].price, 2) });
assert.strictEqual(Object.getPrototypeOf(b.quote), Object.prototype);   // Firestore only stores plain objects
assert.strictEqual(b.quote.trip, data.OFFERS.ladakh[0].price * 2);
assert.strictEqual(b.quote.now + b.quote.later, b.quote.total);
assert.strictEqual(b.end, '2027-06-09');   // 9 days: boarding on day 1

// deposit vs full, and GST, follow pay-config.js
const P = data.PAY, saved = { ...P };
Object.assign(P, { charge: 'deposit', depositPct: 25, gstPct: 5 });
let q = { ...P.quote(100000, 2) }; assert.deepStrictEqual(q, { trip: 200000, gst: 10000, total: 210000, now: 52500, later: 157500 });
Object.assign(P, { charge: 'full', gstPct: 0 });
q = { ...P.quote(100000, 2) }; assert.deepStrictEqual(q, { trip: 200000, gst: 0, total: 200000, now: 200000, later: 0 });
assert.strictEqual(core.paidStatus(q), 'paid');
Object.assign(P, saved);

// bad bookings are refused with a reason a person can read
const refuse = (patch, re) => assert.throws(() => core.validate({ ...ok, ...patch }, data, today), e => e instanceof core.BadRequest && re.test(e.message));
refuse({ place: 'atlantis' }, /place/);
refuse({ place: '__proto__' }, /place/);
refuse({ offer: 9 }, /way/);
refuse({ offer: '0.5' }, /way/);
refuse({ pax: 0 }, /Travellers/);
refuse({ pax: 9 }, /Travellers/);
refuse({ start: '2026-11-30' }, /two weeks/);
refuse({ start: '2029-01-01' }, /18 months/);
refuse({ start: 'soon' }, /boarding date/);
refuse({ name: '  ' }, /name/);
refuse({ email: 'nope' }, /email/);

// Razorpay signatures
const secret = 'test_secret';
const sig = crypto.createHmac('sha256', secret).update('order_1|pay_1').digest('hex');
assert.ok(core.paymentSignatureOk('order_1', 'pay_1', sig, secret));
assert.ok(!core.paymentSignatureOk('order_1', 'pay_2', sig, secret));
assert.ok(!core.paymentSignatureOk('order_1', 'pay_1', sig.slice(1), secret));
assert.ok(!core.paymentSignatureOk('order_1', 'pay_1', sig, ''));
const raw = Buffer.from('{"event":"payment.captured"}');
const hook = crypto.createHmac('sha256', 'hook').update(raw).digest('hex');
assert.ok(core.webhookSignatureOk(raw, hook, 'hook'));
assert.ok(!core.webhookSignatureOk(raw, hook, 'other'));

console.log('all payment checks passed');
