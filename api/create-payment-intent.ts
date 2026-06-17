// Vercel serverless function — POST /api/create-payment-intent
// Creates a Stripe PaymentIntent server-side (the secret key never touches the
// client). If STRIPE_SECRET_KEY is not configured, returns demo mode so the
// checkout flow still completes in non-production / pre-Stripe environments.
//
// Uses Stripe's REST API directly (no SDK dependency).

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, currency = 'usd', metadata = {} } = req.body ?? {};
  const cents = Math.round(Number(amount));
  if (!cents || cents < 50) {
    return res.status(400).json({ error: 'Invalid amount (minimum $0.50)' });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    // Demo mode — no real charge. The order is still recorded as paid (demo).
    return res.status(200).json({ demo: true, status: 'succeeded' });
  }

  try {
    const params = new URLSearchParams();
    params.set('amount', String(cents));
    params.set('currency', currency);
    params.set('automatic_payment_methods[enabled]', 'true');
    for (const [k, v] of Object.entries(metadata)) {
      params.set(`metadata[${k}]`, String(v));
    }

    const resp = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data?.error?.message || 'Stripe error' });
    }
    return res.status(200).json({ clientSecret: data.client_secret, paymentIntentId: data.id });
  } catch (e: any) {
    return res.status(500).json({ error: 'Failed to create payment intent' });
  }
}
