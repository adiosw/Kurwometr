// ══════════════════════════════════════════════════════
// app/api/lucky-shot/check/route.ts
// ══════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('session_id');
  if (!sessionId) return NextResponse.json({ won: false });

  const { data } = await supabase
    .from('donations')
    .select('lucky_shot_won, lucky_tier')
    .eq('stripe_session_id', sessionId)
    .single();

  return NextResponse.json({
    won: data?.lucky_shot_won || false,
    tier: data?.lucky_tier || null,
  });
}
