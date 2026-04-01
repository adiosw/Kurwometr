'use client';
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function PremiumPage() {
  const [loading, setLoading] = useState<string|null>(null);
  const [earlyBirds, setEarlyBirds] = useState<{claimed:number;max_slots:number}|null>(null);
  const [claimed, setClaimed] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [claimLoading, setClaimLoading] = useState(false);

  useEffect(() => {
    fetch('/api/early-bird').then(r=>r.json()).then(d => {
      if (d.counter) setEarlyBirds(d.counter);
      if (d.claimed) setClaimed(d.claimed);
    });
    supabase.auth.getUser().then(({data}) => setUser(data.user));
  }, []);

  async function subscribe(plan: string) {
    setLoading(plan);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) { window.location.href = '/auth'; return; }

      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const { sessionId, error } = await res.json();
      if (error) throw new Error(error);
      const stripe = await stripePromise;
      await stripe!.redirectToCheckout({ sessionId });
    } catch (e: any) {
      alert('Błąd: ' + e.message);
    } finally {
      setLoading(null);
    }
  }

  async function claimEarlyBird() {
    if (!user) { window.location.href = '/auth'; return; }
    setClaimLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const res = await fetch('/api/early-bird', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.data.session?.access_token}` },
      });
      const data = await res.json();
      if (data.status === 'granted') {
        setClaimed(true);
        alert(`🎉 Jesteś ${data.position}. LEGEND! 30 dni darmowego dostępu aktywowane!`);
      } else if (data.status === 'full') {
        alert('Wszystkie miejsca zajęte!');
      } else if (data.status === 'already_claimed') {
        setClaimed(true);
      }
    } finally {
      setClaimLoading(false);
    }
  }

  const remaining = earlyBirds ? earlyBirds.max_slots - earlyBirds.claimed : 100;

  return (
    <div style={{ minHeight:'100vh', background:'#060300', fontFamily:"'Oswald',sans-serif", paddingBottom:80 }}>
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse 80% 40% at 50% 0%,rgba(255,80,0,.09),transparent)', zIndex:0, pointerEvents:'none' }} />
      <div style={{ maxWidth:480, margin:'0 auto', padding:'40px 16px', position:'relative', zIndex:1 }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <h1 style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:44, letterSpacing:4, margin:0,
            background:'linear-gradient(180deg,#fff8e0,#ffaa00,#ff4400)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            filter:'drop-shadow(0 0 20px rgba(255,100,0,.5))' }}>
            ODBLOKUJ PEŁNY WKURW
          </h1>
          <p style={{ color:'rgba(255,150,80,.6)', fontFamily:"'Share Tech Mono',monospace", fontSize:12, marginTop:8, letterSpacing:1 }}>
            BEZ ADS · UNLIMITED MIKROFON · ZŁOTY NICK
          </p>
        </div>

        {/* Early Bird Banner */}
        {remaining > 0 && (
          <div style={{
            background:'linear-gradient(135deg,#1a1000,#0f0800)',
            border:'1px solid rgba(255,180,0,.45)', borderRadius:4, padding:16, marginBottom:24,
            boxShadow:'0 0 30px rgba(255,150,0,.12)',
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
              <div style={{ fontSize:32 }}>⚡</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:20, letterSpacing:3, color:'#ffcc00',
                  filter:'drop-shadow(0 0 8px rgba(255,200,0,.5))' }}>
                  FIRST 100 — EARLY BIRD LEGEND
                </div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'rgba(255,200,80,.55)', marginTop:3 }}>
                  30 dni LEGEND bez limitu · Złoty nick · Za darmo
                </div>
                <div style={{ marginTop:8, height:4, background:'rgba(255,200,0,.1)', borderRadius:2 }}>
                  <div style={{ height:'100%', width:`${((earlyBirds?.claimed||0)/100)*100}%`,
                    background:'linear-gradient(90deg,#ff8800,#ffcc00)', borderRadius:2, transition:'width .5s' }} />
                </div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'rgba(255,180,0,.5)', marginTop:4 }}>
                  {earlyBirds?.claimed||0}/100 zajętych ·{' '}
                  <span style={{ color:'#ffcc00', fontWeight:'bold' }}>Zostało: {remaining} z 100 darmowych kont LEGEND!</span>
                </div>
              </div>
              {!claimed ? (
                <button onClick={claimEarlyBird} disabled={claimLoading} style={{
                  padding:'10px 18px', border:'1px solid rgba(255,200,0,.5)', borderRadius:3,
                  background:'linear-gradient(180deg,#cc8800,#885500)',
                  fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:15, letterSpacing:2, color:'#fff8e0',
                  cursor:claimLoading?'not-allowed':'pointer', boxShadow:'0 0 16px rgba(255,150,0,.25)',
                }}>
                  {claimLoading ? '...' : user ? 'ZGARNIJ' : 'ZALOGUJ'}
                </button>
              ) : (
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:12, color:'#ffcc00' }}>✅ ZGARNIĘTE!</div>
              )}
            </div>
          </div>
        )}

        {/* Plans */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>

          {/* Monthly */}
          <div style={{ background:'linear-gradient(180deg,#1e140a,#140e06)', border:'1px solid rgba(255,80,0,.25)', borderRadius:4, padding:16, position:'relative' }}>
            <div style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:22, letterSpacing:3, color:'#ff8800', marginBottom:4 }}>PREMIUM</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:4 }}>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:12, color:'rgba(255,60,0,.35)', textDecoration:'line-through' }}>19.99 PLN</span>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:26, color:'#ff8800' }}>9.99</span>
              <span style={{ fontSize:11, color:'rgba(255,80,0,.4)' }}>/msc</span>
            </div>
            {['🎤 50 użyć mikrofonu/dobę','🏆 Złoty nick w rankingach','📊 Historia 30 dni','⚡ Brak reklam'].map(f=>(
              <div key={f} style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'rgba(255,150,80,.55)', marginBottom:4 }}>{f}</div>
            ))}
            <button onClick={()=>subscribe('monthly')} disabled={loading==='monthly'} style={{
              width:'100%', padding:'10px', marginTop:12, border:'1px solid rgba(255,80,0,.4)', borderRadius:3,
              background:'linear-gradient(180deg,#881500,#661000)',
              fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:16, letterSpacing:2, color:'#fff8e0', cursor:'pointer',
            }}>{loading==='monthly'?'...':'AKTYWUJ'}</button>
          </div>

          {/* Lifetime */}
          <div style={{ background:'linear-gradient(135deg,#2a1000,#1a0800)', border:'1px solid rgba(255,180,0,.5)', borderRadius:4, padding:16, position:'relative',
            boxShadow:'0 0 30px rgba(255,150,0,.12)' }}>
            <div style={{ position:'absolute', top:0, right:0, background:'linear-gradient(135deg,#cc8800,#885500)',
              padding:'3px 10px', fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:11, letterSpacing:2, color:'#fff8e0' }}>
              BEST DEAL
            </div>
            <div style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:22, letterSpacing:3, color:'#ffcc00', marginBottom:4 }}>LIFETIME</div>
            <div style={{ display:'flex', alignItems:'baseline', gap:6, marginBottom:4 }}>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:12, color:'rgba(255,60,0,.35)', textDecoration:'line-through' }}>69.00 PLN 😈</span>
              <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:26, color:'#ffcc00' }}>49.99</span>
            </div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'rgba(255,200,80,.5)', marginBottom:8, fontStyle:'italic' }}>
              Raz a dobrze.
            </div>
            {['🎤 Unlimited mikrofon NA ZAWSZE','👑 LEGEND nick dożywotnio','📊 Historia bez limitu','⚡ Wszystkie przyszłe funkcje','🍺 Imię w Ścianie Chwały'].map(f=>(
              <div key={f} style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'rgba(255,200,80,.6)', marginBottom:4 }}>{f}</div>
            ))}
            <button onClick={()=>subscribe('lifetime')} disabled={loading==='lifetime'} style={{
              width:'100%', padding:'10px', marginTop:12, border:'1px solid rgba(255,200,0,.5)', borderRadius:3,
              background:'linear-gradient(180deg,#cc8800,#885500)',
              fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:16, letterSpacing:2, color:'#fff8e0', cursor:'pointer',
              boxShadow:'0 0 20px rgba(255,150,0,.2)',
            }}>{loading==='lifetime'?'...':'ZGARNIJ LIFETIME'}</button>
          </div>
        </div>

        {/* Comparison free */}
        <div style={{ background:'#0d0800', border:'1px solid rgba(255,40,0,.12)', borderRadius:4, padding:12, marginBottom:20 }}>
          <div style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:16, letterSpacing:2, color:'rgba(255,60,0,.4)', marginBottom:8 }}>BEZPŁATNY</div>
          {['🎤 10 użyć mikrofonu/dobę','Podstawowe funkcje','Brak złotego nicku'].map(f=>(
            <div key={f} style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'rgba(255,60,0,.3)', marginBottom:3 }}>{f}</div>
          ))}
        </div>

        <p style={{ textAlign:'center', fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'rgba(255,60,0,.25)' }}>
          🔒 Stripe · Bezpieczna płatność · BLIK, P24, Karta
        </p>
      </div>
    </div>
  );
}
