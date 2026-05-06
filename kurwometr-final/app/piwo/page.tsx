'use client';
import { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/lib/supabase';
import LuckyShotResult from '@/components/donate/LuckyShotResult';
import { useSearchParams } from 'next/navigation';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const BEERS = [
  { id: 'zubr',     emoji: '🐂', name: 'Żubr',       price: 3.50 },
  { id: 'tyskie',   emoji: '🏔️', name: 'Tyskie',     price: 4.00 },
  { id: 'perla',    emoji: '💎', name: 'Perła',       price: 4.50 },
  { id: 'harnas',   emoji: '🦅', name: 'Harnaś',      price: 5.00 },
  { id: 'kraft',    emoji: '🍺', name: 'Zimny Kraft', price: 9.00 },
  { id: 'vip',      emoji: '👑', name: 'VIP Browar',  price: 20.00 },
  { id: 'oswiecim', emoji: '🔥', name: 'Spec. Oświęcim', price: 2.137 },
];

type Donation = { donor_name:string; amount:number; beer_type:string; beer_custom_name:string|null; message:string|null; created_at:string; donor_tier:number; lucky_shot_won:boolean };
type Stats = { total_beers:number; total_pln:number; unique_donors:number };
type HofEntry = { donor_name:string; total_amount:number; beer_count:number; tier:number };

const tier = (t:number) => t>=2?{color:'#ffaa00',shadow:'0 0 10px rgba(255,170,0,.6)'}:t===1?{color:'#88aaff',shadow:'none'}:{color:'rgba(255,200,150,.6)',shadow:'none'};

export default function PiwoPage() {
  const params = useSearchParams();
  const success = params.get('success');
  const sessionId = params.get('session_id');

  const [selectedBeer, setSelectedBeer] = useState(BEERS[0]);
  const [customBeerName, setCustomBeerName] = useState('');
  const [amount, setAmount] = useState(3.50);
  const [amountInput, setAmountInput] = useState('3.50');
  const [message, setMessage] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isAnon, setIsAnon] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<Stats>({ total_beers:0, total_pln:0, unique_donors:0 });
  const [feed, setFeed] = useState<Donation[]>([]);
  const [hof, setHof] = useState<HofEntry[]>([]);
  const [luckyResult, setLuckyResult] = useState<{won:boolean;tier?:number}|null>(null);

  // Check for Lucky Shot result after redirect
  useEffect(() => {
    if (success === 'true' && sessionId) {
      fetch(`/api/lucky-shot/check?session_id=${sessionId}`)
        .then(r => r.json())
        .then(data => {
          if (data.won) setLuckyResult({ won: true, tier: data.tier });
          else setLuckyResult({ won: false });
        });
    }
  }, [success, sessionId]);

  useEffect(() => {
    fetchAll();
    const ch = supabase.channel('donations_rt')
      .on('postgres_changes', { event:'INSERT', schema:'public', table:'donations' }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function fetchAll() {
    const [s, f, h] = await Promise.all([
      supabase.from('donation_stats').select('*').single(),
      supabase.from('recent_donations').select('*'),
      supabase.from('hall_of_fame').select('*'),
    ]);
    if (s.data) setStats(s.data as Stats);
    if (f.data) setFeed(f.data as Donation[]);
    if (h.data) setHof(h.data as HofEntry[]);
  }

  const handleAmountSlider = (v: number) => {
    const rounded = Math.round(v * 100) / 100;
    setAmount(rounded);
    setAmountInput(rounded.toFixed(2));
  };

  const handleAmountInput = (v: string) => {
    setAmountInput(v);
    const parsed = parseFloat(v);
    if (!isNaN(parsed) && parsed >= 2 && parsed <= 1000) setAmount(parsed);
  };

  const selectBeer = (b: typeof BEERS[0]) => {
    setSelectedBeer(b);
    setAmount(b.price);
    setAmountInput(b.price.toFixed(2));
    setCustomBeerName('');
  };

  const handleDonate = async () => {
    if (amount < 2) { alert('Minimalna kwota to 2.00 PLN!'); return; }
    setLoading(true);
    try {
      const authHeader = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: `Bearer ${authHeader}` } : {}),
        },
        body: JSON.stringify({
          amount,
          beer_type: customBeerName.trim() ? null : selectedBeer.id,
          beer_custom_name: customBeerName.trim() || null,
          message: message.trim() || null,
          display_name: isAnon ? null : displayName.trim() || null,
          is_anonymous: isAnon,
        }),
      });
      const { sessionId, error } = await res.json();
      if (error) throw new Error(error);
      const stripe = await stripePromise;
      await stripe!.redirectToCheckout({ sessionId });
    } catch (e: any) {
      alert('Błąd: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const displayBeerName = customBeerName.trim() || selectedBeer.name;

  return (
    <div style={{ minHeight:'100vh', background:'#060300', fontFamily:"'Oswald',sans-serif", paddingBottom:80 }}>
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse 80% 40% at 50% 0%,rgba(255,80,0,.09),transparent),linear-gradient(180deg,#0a0500,#060300)', zIndex:0, pointerEvents:'none' }} />

      {/* Lucky Shot Result Overlay */}
      {luckyResult && <LuckyShotResult result={luckyResult} onClose={() => setLuckyResult(null)} />}

      <div style={{ maxWidth:520, margin:'0 auto', padding:'40px 16px', position:'relative', zIndex:1 }}>

        {/* HEADER */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:56, marginBottom:8, filter:'drop-shadow(0 0 20px rgba(255,150,0,.5))' }}>🍺</div>
          <h1 style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:48, letterSpacing:4, margin:0,
            background:'linear-gradient(180deg,#fff8e0,#ffaa00,#ff6600)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            filter:'drop-shadow(0 0 20px rgba(255,100,0,.4))' }}>
            POSTAW PIWO DEVELOPEROWI
          </h1>
          <p style={{ color:'rgba(255,150,80,.65)', fontFamily:"'Share Tech Mono',monospace", fontSize:12, marginTop:8, letterSpacing:1, lineHeight:1.6 }}>
            Serwery nie działają na wodzie. Pozdro z Oświęcimia! 🤙
          </p>
          <a href="/o-nas" style={{ color:'rgba(255,80,0,.4)', fontSize:11, fontFamily:'monospace', textDecoration:'underline dotted' }}>
            Kim jesteś, developerze? →
          </a>
        </div>

        {/* LIVE STATS */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:20 }}>
          {[
            { label:'🍺 PIWA', val: stats.total_beers },
            { label:'💰 PLN', val: `${Number(stats.total_pln).toFixed(2)}` },
            { label:'👥 OSÓB', val: stats.unique_donors },
          ].map(s=>(
            <Panel key={s.label} style={{ padding:'12px 8px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:'rgba(255,100,0,.4)', letterSpacing:3, marginBottom:4 }}>{s.label}</div>
              <div style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:24, color:'#ff8800', textShadow:'0 0 10px rgba(255,100,0,.4)' }}>{s.val}</div>
            </Panel>
          ))}
        </div>

        {/* BEER SELECTOR */}
        <Panel style={{ padding:14, marginBottom:14 }}>
          <SectLabel>WYBIERZ GATUNEK PIWA</SectLabel>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
            {BEERS.map(b=>(
              <button key={b.id} onClick={()=>selectBeer(b)} style={{
                padding:'10px 4px', border:`1px solid ${selectedBeer.id===b.id&&!customBeerName?'rgba(255,150,0,.7)':'rgba(255,60,0,.15)'}`,
                borderRadius:3, background:selectedBeer.id===b.id&&!customBeerName?'linear-gradient(180deg,#aa3300,#771500)':'#120800',
                cursor:'pointer', textAlign:'center', transition:'all .15s',
                boxShadow:selectedBeer.id===b.id&&!customBeerName?'0 0 16px rgba(255,80,0,.3)':'none',
              }}>
                <div style={{ fontSize:22 }}>{b.emoji}</div>
                <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:8, color:selectedBeer.id===b.id&&!customBeerName?'#ffaa00':'rgba(255,80,0,.4)', marginTop:3, letterSpacing:1 }}>{b.name.split(' ')[0]}</div>
                <div style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:13, color:selectedBeer.id===b.id&&!customBeerName?'#ff8800':'rgba(255,60,0,.3)', marginTop:2 }}>{b.price.toFixed(2)}</div>
              </button>
            ))}
          </div>

          {/* Custom beer name */}
          <div>
            <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:'rgba(255,100,0,.4)', letterSpacing:3, marginBottom:6 }}>
              INNE? WPISZ NAZWĘ PIWA (np. Mocny Gaz, Sok z gumijagód):
            </div>
            <input
              type="text" maxLength={50}
              placeholder="Wpisz dowolną nazwę piwa..."
              value={customBeerName}
              onChange={e => setCustomBeerName(e.target.value)}
              style={{ width:'100%', padding:'10px 12px', background:'#0a0400', border:`1px solid ${customBeerName?'rgba(255,150,0,.5)':'rgba(255,60,0,.2)'}`, borderRadius:3, color:customBeerName?'#ffaa00':'rgba(255,200,150,.5)', fontFamily:"'Oswald',sans-serif", fontSize:14, outline:'none', transition:'border .2s' }}
            />
            {customBeerName && (
              <div style={{ fontSize:11, color:'rgba(255,150,0,.5)', fontFamily:'monospace', marginTop:4 }}>
                ✅ Pojawi się w feedzie jako: <em>"{customBeerName}"</em>
              </div>
            )}
          </div>
        </Panel>

        {/* AMOUNT SLIDER */}
        <Panel style={{ padding:16, marginBottom:14 }}>
          <SectLabel>SUWAK MOCY</SectLabel>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
            <input
              type="range" min="2.00" max="1000" step="0.01" value={amount}
              onChange={e => handleAmountSlider(Number(e.target.value))}
              style={{ flex:1, accentColor:'#ff6600', cursor:'pointer', height:6 }}
            />
            <div style={{ display:'flex', alignItems:'center', gap:4, background:'#0a0400', border:'1px solid rgba(255,80,0,.3)', borderRadius:3, padding:'6px 10px' }}>
              <input
                type="number" min="2" max="1000" step="0.01"
                value={amountInput}
                onChange={e => handleAmountInput(e.target.value)}
                onBlur={() => {
                  if (amount < 2) { setAmount(2); setAmountInput('2.00'); }
                  setAmountInput(amount.toFixed(2));
                }}
                style={{ background:'none', border:'none', color:'#ff8800', fontFamily:"'Share Tech Mono',monospace", fontSize:18, width:70, outline:'none', textAlign:'right' }}
              />
              <span style={{ color:'rgba(255,80,0,.4)', fontFamily:'monospace', fontSize:12 }}>PLN</span>
            </div>
          </div>

          {/* Quick amounts */}
          <div style={{ display:'flex', gap:6, marginBottom:10 }}>
            {[2.00, 5.00, 11.04, 20.00, 50.00, 100.00].map(p=>(
              <button key={p} onClick={()=>handleAmountSlider(p)} style={{
                flex:1, padding:'5px 4px', border:`1px solid ${amount===p?'rgba(255,150,0,.6)':'rgba(255,60,0,.15)'}`,
                borderRadius:3, background:amount===p?'rgba(255,80,0,.12)':'#120800',
                color:p===11.04?(amount===p?'#ffcc00':'rgba(255,180,0,.4)'):(amount===p?'#ff8800':'rgba(255,60,0,.35)'),
                fontFamily:"'Share Tech Mono',monospace", fontSize:10, cursor:'pointer',
                boxShadow:p===11.04?'0 0 8px rgba(255,200,0,.1)':'none',
              }}>{p===11.04?'🎰':''}{p.toFixed(2)}</button>
            ))}
          </div>

          <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:10, color:'rgba(255,80,0,.35)', margin:0, lineHeight:1.5, borderTop:'1px solid rgba(255,40,0,.1)', paddingTop:10 }}>
            Minimalna wpłata to 2 PLN – resztę zjada prowizja gigantów, a my chcemy piwo, nie okruchy.
          </p>
        </Panel>

        {/* MESSAGE + NAME */}
        <Panel style={{ padding:14, marginBottom:14 }}>
          <SectLabel>WIADOMOŚĆ (OPCJONALNIE)</SectLabel>
          <input
            type="text" maxLength={200}
            placeholder="Hej, dzięki za Kurwomat, uratował mi dzień..."
            value={message} onChange={e=>setMessage(e.target.value)}
            style={{ width:'100%', padding:'10px 12px', background:'#0a0400', border:'1px solid rgba(255,60,0,.2)', borderRadius:3, color:'#fff8e0', fontFamily:"'Oswald',sans-serif", fontSize:14, outline:'none', marginBottom:10 }}
          />
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <input
              type="text" maxLength={30}
              placeholder="Twój nick (np. Kowalski z Wrocławia)"
              value={displayName} onChange={e=>setDisplayName(e.target.value)}
              disabled={isAnon}
              style={{ flex:1, padding:'9px 12px', background:'#0a0400', border:'1px solid rgba(255,60,0,.2)', borderRadius:3, color:isAnon?'rgba(255,80,0,.25)':'#fff8e0', fontFamily:"'Oswald',sans-serif", fontSize:13, outline:'none' }}
            />
            <label style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', color:'rgba(255,100,0,.5)', fontFamily:"'Share Tech Mono',monospace", fontSize:10, whiteSpace:'nowrap' }}>
              <input type="checkbox" checked={isAnon} onChange={e=>setIsAnon(e.target.checked)} style={{ accentColor:'#ff6600' }} />
              ANONIM
            </label>
          </div>
        </Panel>

        {/* DONATE BUTTON */}
        <button onClick={handleDonate} disabled={loading||amount<2} style={{
          width:'100%', padding:18, border:'1px solid rgba(255,100,0,.5)', borderRadius:3,
          background:loading?'rgba(255,80,0,.08)':'linear-gradient(180deg,#cc3300,#881500)',
          fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:26, letterSpacing:4,
          color:loading?'rgba(255,80,0,.3)':'#fff8e0',
          cursor:loading||amount<2?'not-allowed':'pointer',
          boxShadow:'0 0 40px rgba(255,60,0,.25),inset 0 1px 0 rgba(255,180,80,.2)',
          transition:'all .2s', marginBottom:6,
        }}>
          {loading ? '⏳ PRZEKIEROWANIE...' : `🍺 POSTAW ${displayBeerName.toUpperCase()} ZA ${amount.toFixed(2)} PLN`}
        </button>
        <p style={{ textAlign:'center', fontSize:10, color:'rgba(255,60,0,.25)', fontFamily:'monospace', margin:'0 0 24px' }}>
          🔒 Płatność przez Stripe · BLIK, P24, Karta · Zero subskrypcji
        </p>

        {/* OSTATNIE PIWA TICKER */}
        {feed.length > 0 && (
          <Panel style={{ padding:14, marginBottom:14 }}>
            <SectLabel>🔥 OSTATNIE PIWA (LIVE)</SectLabel>
            {feed.map((d,i)=>(
              <div key={d.created_at+i} style={{
                display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0',
                borderBottom:i<feed.length-1?'1px solid rgba(255,40,0,.08)':'none',
              }}>
                <span style={{ fontSize:18, flexShrink:0 }}>
                  {d.beer_custom_name ? '🍻' : BEERS.find(b=>b.id===d.beer_type)?.emoji || '🍺'}
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:14, letterSpacing:1, ...tier(d.donor_tier) }}>
                      {d.lucky_shot_won && '🎰 '}{d.donor_name}
                    </span>
                    <span style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:'#ff8800' }}>
                      {Number(d.amount).toFixed(2)} PLN
                    </span>
                    <span style={{ fontFamily:'monospace', fontSize:10, color:'rgba(255,80,0,.4)' }}>
                      {d.beer_custom_name || d.beer_type}
                    </span>
                  </div>
                  {d.message && (
                    <div style={{ fontSize:11, color:'rgba(255,150,80,.55)', fontFamily:'monospace', marginTop:2, fontStyle:'italic' }}>
                      "{d.message}"
                    </div>
                  )}
                </div>
                <span style={{ fontSize:10, color:'rgba(255,40,0,.25)', fontFamily:'monospace', flexShrink:0, marginTop:2 }}>
                  {new Date(d.created_at).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'})}
                </span>
              </div>
            ))}
          </Panel>
        )}

        {/* HALL OF FAME */}
        {hof.length > 0 && (
          <Panel style={{ padding:14 }}>
            <SectLabel>🏛️ ŚCIANA CHWAŁY — TOP DARCZYŃCY WSZECH CZASÓW</SectLabel>
            {hof.map((h,i)=>(
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:i<hof.length-1?'1px solid rgba(255,40,0,.08)':'none' }}>
                <span style={{ fontSize:24 }}>{['🥇','🥈','🥉'][i]}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:18, letterSpacing:1,
                    ...tier(h.tier||0) }}>
                    {h.donor_name}
                  </div>
                  <div style={{ fontSize:10, color:'rgba(255,80,0,.35)', fontFamily:'monospace' }}>
                    {h.beer_count} piw łącznie
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:20, color:'#ff8800' }}>
                    {Number(h.total_amount).toFixed(2)} PLN
                  </div>
                </div>
              </div>
            ))}
          </Panel>
        )}
      </div>
    </div>
  );
}

function Panel({ children, style={} }: { children:React.ReactNode; style?:any }) {
  return (
    <div style={{ background:'linear-gradient(180deg,#1e140a,#140e06)', border:'1px solid rgba(255,100,0,.22)', borderRadius:3, position:'relative', overflow:'hidden', ...style }}>
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'repeating-linear-gradient(90deg,transparent 0px,transparent 3px,rgba(255,255,255,.005) 3px,rgba(255,255,255,.005) 4px)' }}/>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg,transparent,rgba(255,150,0,.4),transparent)', pointerEvents:'none' }}/>
      <div style={{ position:'relative', zIndex:1 }}>{children}</div>
    </div>
  );
}
function SectLabel({ children }: { children:React.ReactNode }) {
  return <div style={{ fontSize:9, letterSpacing:5, color:'rgba(255,100,0,.4)', fontFamily:"'Share Tech Mono',monospace", marginBottom:10 }}>{children}</div>;
}
