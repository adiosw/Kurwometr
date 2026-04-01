import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-04-10' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, beer_type, beer_custom_name, message, display_name, is_anonymous } = body;

    // ── BACKEND VALIDATION ──
    const amountNum = Number(amount);
    if (!amountNum || amountNum < 2.00) {
      return NextResponse.json({ error: 'Minimalna kwota to 2.00 PLN. Reszta to okruchy dla gigantów.' }, { status: 400 });
    }
    if (amountNum > 1000) {
      return NextResponse.json({ error: 'Max 1000 PLN. Serio, dziękujemy ale hej.' }, { status: 400 });
    }

    // Validate with Stripe API: round to 2 decimals, convert to grosze
    const amountGrosze = Math.round(amountNum * 100);
    if (amountGrosze < 200) {
      return NextResponse.json({ error: 'Za mało. Prowizja Stripe zjada całość.' }, { status: 400 });
    }

    // Get user if logged in
    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      userId = user?.id || null;
    }

    // Create pending donation record
    const { data: donation, error: dbErr } = await supabase.from('donations').insert({
      user_id: userId,
      amount: amountNum,
      beer_type: beer_type || null,
      beer_custom_name: beer_custom_name?.trim() || null,
      message: message?.trim()?.slice(0, 200) || null,
      display_name: is_anonymous ? null : display_name?.trim()?.slice(0, 40) || null,
      is_anonymous: !!is_anonymous,
      status: 'pending',
    }).select().single();

    if (dbErr) throw new Error(dbErr.message);

    const productName = beer_custom_name?.trim()
      ? `🍺 ${beer_custom_name.trim()} dla developera Kurwomatu`
      : `🍺 ${beer_type || 'Piwo'} dla developera Kurwomatu`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'blik', 'p24'],
      line_items: [{
        price_data: {
          currency: 'pln',
          product_data: {
            name: productName,
            description: message || `Wsparcie projektu Kurwomat z Oświęcimia 🔥`,
          },
          unit_amount: amountGrosze,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/piwo?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/piwo?canceled=true`,
      locale: 'pl',
      metadata: {
        donation_id: donation.id.toString(),
        user_id: userId || '',
        amount: amountNum.toFixed(2),
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    console.error('[donate/create-session]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
