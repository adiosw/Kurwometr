import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'O Nas — Kurwomat',
  description: 'Historia Kurwomatu. Chłopak z Oświęcimia, łazienka i misja zliczania polskiej frustracji.',
};

export default function ONasPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#060300', fontFamily:"'Oswald',sans-serif", paddingBottom:80 }}>
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse 60% 30% at 50% 0%,rgba(255,60,0,.07),transparent)', zIndex:0, pointerEvents:'none' }} />

      <div style={{ maxWidth:680, margin:'0 auto', padding:'40px 20px', position:'relative', zIndex:1 }}>
        {/* Safety stripe */}
        <div style={{ height:5, background:'repeating-linear-gradient(45deg,#ff2200 0px,#ff2200 6px,#1a0800 6px,#1a0800 12px)', marginBottom:32, opacity:.7 }} />

        <h1 style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:52, letterSpacing:4, margin:'0 0 8px',
          background:'linear-gradient(180deg,#fff8e0,#ffaa00,#ff4400)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          O NAS
        </h1>
        <div style={{ color:'rgba(255,80,0,.3)', fontFamily:"'Share Tech Mono',monospace", fontSize:11, marginBottom:36, letterSpacing:2 }}>
          INSTYTUT WKURWU NARODOWEGO · OŚWIĘCIM
        </div>

        {/* The exact text from the spec */}
        <div style={{
          background:'linear-gradient(180deg,#1e140a,#140e06)', border:'1px solid rgba(255,100,0,.22)',
          borderRadius:4, padding:'28px 24px', marginBottom:32,
          position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'repeating-linear-gradient(90deg,transparent 0px,transparent 3px,rgba(255,255,255,.005) 3px,rgba(255,255,255,.005) 4px)' }}/>
          <div style={{ position:'relative', zIndex:1 }}>
            <p style={{ color:'rgba(255,200,150,.85)', fontSize:16, lineHeight:2, margin:0, fontWeight:400 }}>
              Hej! 👋 Tu twórca Kurwomatu. Ten projekt nie powstał w sterylnym biurze ani w szklanym wieżowcu. Kurwomat narodził się w... mojej łazience w Oświęcimiu. 🚽✨ Tak, serio. Jestem zwykłym chłopakiem, który nocami, gdy dziecko w końcu zaśnie 🍼💤, zamyka się w łazience z zimnym piwkiem 🍻 i fajką 🚬 w ręku. Nie wiem dlaczego, ale to pomieszczenie ma w sobie jakąś magię, która sprawia, że zamiast spać... liczę kurwy. 😅 Zamiast budować kolejną nudną aplikację do fitnessu, stworzyłem to "dzieło chaosu". Kurwomat to miejsce, gdzie możesz wyrzucić z siebie emocje, krzyknąć soczyste „KURWA!" i sprawdzić, czy Twoja frustracja mieści się w krajowej normie. 📈🔥 Pamiętaj: To projekt w 100% niezależny. Każde "piwo", które mi postawisz, trafia bezpośrednio do kolesia z Oświęcimia, który w oparach dymu pilnuje, żeby te serwery nie wybuchły. Twoje wsparcie to paliwo dla tego projektu (i kolejna puszka w lodówce). 🚀 Dzięki, że tu jesteś. Mierz wkurw, dziel się wynikami i baw się dobrze – bo każdy dzień zasługuje na swoją dawkę emocji! 💥
            </p>
          </div>
        </div>

        {/* Links */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:32 }}>
          {[
            { label:'🍺 POSTAW PIWO', href:'/piwo', color:'#ff8800' },
            { label:'⚡ PREMIUM', href:'/premium', color:'#ffcc00' },
            { label:'📖 REGULAMIN', href:'/regulamin', color:'rgba(255,80,0,.5)' },
            { label:'🔒 PRYWATNOŚĆ', href:'/polityka-prywatnosci', color:'rgba(255,80,0,.5)' },
          ].map(l=>(
            <a key={l.href} href={l.href} style={{
              display:'block', padding:'12px 16px',
              background:'linear-gradient(180deg,#1e140a,#140e06)', border:'1px solid rgba(255,60,0,.2)',
              borderRadius:3, textDecoration:'none',
              fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:16, letterSpacing:2,
              color:l.color, textAlign:'center', transition:'all .2s',
            }}>{l.label}</a>
          ))}
        </div>

        {/* Stack */}
        <div style={{ background:'#0d0800', border:'1px solid rgba(255,40,0,.12)', borderRadius:3, padding:16 }}>
          <div style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:'rgba(255,100,0,.35)', letterSpacing:4, marginBottom:10 }}>STACK TECHNOLOGICZNY</div>
          <p style={{ color:'rgba(255,150,80,.5)', fontFamily:'monospace', fontSize:12, margin:0, lineHeight:1.8 }}>
            Next.js 14 App Router · TypeScript · Supabase (Auth + DB + Realtime) · Stripe (BLIK, P24, Card) · Vercel Edge · Web Speech API · Canvas API · PWA · @vercel/og
          </p>
          <p style={{ color:'rgba(255,60,0,.25)', fontFamily:'monospace', fontSize:10, margin:'12px 0 0' }}>
            Zbudowane z ❤️ i ☕ w łazience w Oświęcimiu · v3.0
          </p>
        </div>

        <div style={{ height:5, background:'repeating-linear-gradient(45deg,#ff2200 0px,#ff2200 6px,#1a0800 6px,#1a0800 12px)', marginTop:32, opacity:.5 }} />
      </div>
    </div>
  );
}
