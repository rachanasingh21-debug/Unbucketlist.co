/* Checkout with Razorpay. Does nothing until PAY.on is true (pay-config.js).
   Flow: the server creates an order for the amount IT works out (never the browser's number) -> Razorpay's own window takes
   the payment (cards, UPI, netbanking, wallets) -> the server checks Razorpay's signature and marks the booking paid.
   A Razorpay webhook (functions/) also marks it paid if the visitor closes the page before the last step. */
(function () {
  const C = () => window.PAY || {};
  const err = (code, message, extra) => Object.assign(new Error(message), { code }, extra || {});

  function ready() {
    const c = C();
    return !!(c.on && c.provider === 'razorpay' && c.keyId && c.api);
  }

  let sdk = null;
  function loadSdk() {
    if (window.Razorpay) return Promise.resolve();
    return sdk || (sdk = new Promise((ok, no) => {
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.async = true;
      s.onload = () => ok();
      s.onerror = () => { sdk = null; no(err('network', 'We could not reach the payment window. Check your connection and try again. Nothing was charged.')) };
      document.head.appendChild(s);
    }));
  }

  async function post(path, body) {
    let r;
    try {
      r = await fetch(C().api.replace(/\/$/, '') + '/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    } catch (e) {
      throw err('network', 'We could not reach our booking desk. Check your connection and try again. Nothing was charged.');
    }
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw err('server', j.error || 'Something went wrong on our side. Nothing was charged.');
    return j;
  }

  /* b: {place, offer (index), pax, start ('YYYY-MM-DD'), name, email, description}
     resolves {status:'deposit_paid'|'paid', bookingId, paymentId, quote}; rejects with .code 'dismissed' | 'failed' | 'network' | 'server' | 'verify' */
  async function checkout(b) {
    await loadSdk();
    const o = await post('createOrder', { place: b.place, offer: b.offer, pax: b.pax, start: b.start, name: b.name, email: b.email });
    return new Promise((ok, no) => {
      let done = false, lastFail = '';
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#46cdbb';
      const rz = new window.Razorpay({
        key: o.keyId || C().keyId,
        order_id: o.orderId,
        amount: o.amount,
        currency: o.currency || 'INR',
        name: C().business || 'Unbucketlist',
        description: b.description,
        prefill: { name: b.name, email: b.email },
        notes: { bookingId: o.bookingId },
        theme: { color: accent },
        handler: async res => {
          done = true;
          try {
            const v = await post('verifyPayment', { bookingId: o.bookingId, ...res });
            ok({ ...v, bookingId: o.bookingId, paymentId: res.razorpay_payment_id, quote: o.quote });
          } catch (e) {
            no(err('verify', `Your payment went through, but we could not confirm it just yet. Keep this reference: ${res.razorpay_payment_id}. We will confirm by email.`, { paymentId: res.razorpay_payment_id }));
          }
        },
        modal: { ondismiss: () => { if (!done) no(err(lastFail ? 'failed' : 'dismissed', lastFail ? `The payment did not go through: ${lastFail} Nothing was charged.` : 'Payment cancelled. Nothing was charged.')) } },
      });
      // a failed attempt keeps Razorpay's window open so the visitor can try another way; remember why, in case they close it
      rz.on('payment.failed', r => { lastFail = (r && r.error && r.error.description) || 'the bank declined it.'; if (!/[.!?]$/.test(lastFail)) lastFail += '.' });
      rz.open();
    });
  }

  window.Pay = { ready, checkout, preload: () => ready() && loadSdk().catch(() => {}) };
})();
