import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── DONATION COMPLETE ──
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { donation_id, user_id, amount } = session.metadata || {};

        if (donation_id) {
          // Update donation status
          await supabase.from('donations').update({
            status: 'completed',
            stripe_session_id: session.id,
            stripe_payment_id: session.payment_intent as string,
          }).eq('id', parseInt(donation_id));

          // ── LUCKY SHOT CHECK ──
          if (user_id && amount) {
            const { data: luckyResult } = await supabase.rpc('check_and_rotate_lucky', {
              p_amount: parseFloat(amount),
              p_user_id: user_id,
              p_donation_id: parseInt(donation_id),
            });
            console.log('[LuckyShot]', luckyResult);
          }

          // Update donor status
          if (user_id) {
            await supabase.rpc('update_donor_status', {
              p_user_id: user_id,
              p_amount: parseFloat(amount || '0'),
            });
          }
        }
        break;
      }

      // ── SUBSCRIPTION CREATED/UPDATED ──
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const { data: existing } = await supabase
          .from('subscriptions').select('user_id')
          .eq('stripe_customer_id', sub.customer as string).single();

        if (existing) {
          const isActive = sub.status === 'active';
          const periodEnd = new Date(sub.current_period_end * 1000).toISOString();

          await supabase.from('subscriptions').upsert({
            user_id: existing.user_id,
            stripe_customer_id: sub.customer as string,
            stripe_sub_id: sub.id,
            plan: sub.metadata?.plan || 'monthly',
            status: sub.status,
            current_period_end: periodEnd,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'stripe_sub_id' });

          if (isActive) {
            await supabase.from('profiles').update({
              tier: 1,
              tier_expires_at: periodEnd,
            }).eq('id', existing.user_id);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const { data: s } = await supabase.from('subscriptions')
          .update({ status: 'canceled' }).eq('stripe_sub_id', sub.id).select('user_id').single();
        if (s) {
          await supabase.from('profiles').update({ tier: 0, tier_expires_at: null }).eq('id', s.user_id);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        // Mark associated donation as failed
        await supabase.from('donations').update({ status: 'refunded' })
          .eq('stripe_payment_id', pi.id);
        break;
      }
    }
  } catch (err: any) {
    console.error('[webhook handler]', err);
    // Don't return 500 to Stripe — it would retry
  }

  return NextResponse.json({ received: true });
}
