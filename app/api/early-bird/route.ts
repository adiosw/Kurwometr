// ══════════════════════════════════════════════════════
// app/api/early-bird/route.ts
// ══════════════════════════════════════════════════════
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function GET(req: NextRequest) {
  const { data: counter } = await supabase.from('early_bird_counter').select('claimed,max_slots').eq('id',1).single();

  const authHeader = req.headers.get('authorization');
  let claimed = false;
  if (authHeader?.startsWith('Bearer ')) {
    const { data:{user} } = await supabase.auth.getUser(authHeader.replace('Bearer ',''));
    if (user) {
      const { data: eb } = await supabase.from('early_birds').select('id').eq('user_id',user.id).single();
      claimed = !!eb;
    }
  }

  return NextResponse.json({ counter, claimed });
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error:'Unauthorized' }, { status:401 });

  const { data:{user} } = await supabase.auth.getUser(authHeader.replace('Bearer ',''));
  if (!user) return NextResponse.json({ error:'Invalid token' }, { status:401 });

  const { data, error } = await supabase.rpc('claim_early_bird', { p_user_id: user.id });
  if (error) return NextResponse.json({ error: error.message }, { status:500 });

  return NextResponse.json(data);
}
