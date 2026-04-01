import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { plan } = await req.json();
    if (!['monthly', 'lifetime'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Musisz być zalogowany' }, { status: 401 });
    }

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get or create Stripe customer
    let customerId: string;
    const { data: sub } = await supabase.from('subscriptions')
      .select('stripe_customer_id').eq('user_id', user.id).single();

    if (sub?.stripe_customer_id) {
      customerId = sub.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
    }

    const priceId = plan === 'monthly'
      ? process.env.STRIPE_PRICE_MONTHLY!
      : process.env.STRIPE_PRICE_LIFETIME!;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card', 'blik', 'p24'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: plan === 'monthly' ? 'subscription' : 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/premium?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/premium`,
      locale: 'pl',
      metadata: { plan, user_id: user.id },
      subscription_data: plan === 'monthly' ? { metadata: { plan, user_id: user.id } } : undefined,
    });

    // Save customer ID
    await supabase.from('subscriptions').upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      plan,
      status: 'pending',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
