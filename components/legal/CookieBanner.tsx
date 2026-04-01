// ══════════════════════════════════════════════════════
// components/legal/CookieBanner.tsx
// ══════════════════════════════════════════════════════
'use client';
import { useState, useEffect } from 'react';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('kw_consent');
    if (!saved) setTimeout(() => setVisible(true), 800);
  }, []);

  function accept() {
    localStorage.setItem('kw_consent', JSON.stringify({ accepted:true, ts:Date.now() }));
    setVisible(false);
    // Fire GA if accepted
    if (window.gtag) window.gtag('consent', 'update', { analytics_storage:'granted' });
  }

  if (!visible) return null;

  return (
    <>
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', zIndex:998, backdropFilter:'blur(4px)' }} />
      <div style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:999,
        background:'linear-gradient(180deg,#1e0a00,#120600)',
        borderTop:'2px solid rgba(255,80,0,.6)',
        boxShadow:'0 -10px 60px rgba(255,40,0,.3)',
        padding:'20px 20px 28px',
        animation:'slideUp .4s ease-out',
      }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:4,
          background:'repeating-linear-gradient(45deg,#ff2200 0px,#ff2200 6px,#1a0800 6px,#1a0800 12px)', opacity:.8 }} />

        <div style={{ maxWidth:500, margin:'0 auto' }}>
          <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
            <span style={{ fontSize:32, flexShrink:0, filter:'drop-shadow(0 0 10px rgba(255,80,0,.7))' }}>⚠️</span>
            <div>
              <div style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:20, letterSpacing:3, color:'#ff8800', marginBottom:8 }}>
                INSTYTUT WKURWU — PROTOKÓŁ PRYWATNOŚCI
              </div>
              <p style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:11, color:'rgba(255,200,100,.7)', lineHeight:1.7, margin:0 }}>
                Kurwomat używa <strong style={{color:'#ff8800'}}>ciasteczek</strong> i opcjonalnie <strong style={{color:'#ff8800'}}>mikrofonu</strong> (wyłącznie lokalnie w przeglądarce — nic nie nagrywamy!), żeby mierzyć poziom narodowej frustracji w czasie rzeczywistym. Wchodzisz na własne ryzyko.
              </p>
              <div style={{ display:'flex', gap:14, marginTop:10, flexWrap:'wrap' }}>
                {['🎤 Mikrofon: lokalnie','📊 Dane: anonimowe','🚫 Brak nagrań','🍪 Ciastka: session'].map(b=>(
                  <span key={b} style={{ fontFamily:"'Share Tech Mono',monospace", fontSize:9, color:'rgba(255,150,80,.55)' }}>{b}</span>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <button onClick={accept} style={{
              flex:1, padding:'13px 20px', border:'1px solid rgba(255,100,0,.5)', borderRadius:3,
              background:'linear-gradient(180deg,#cc2200,#881500)',
              fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:18, letterSpacing:3, color:'#fff8e0',
              cursor:'pointer', boxShadow:'0 0 30px rgba(255,40,0,.35)',
            }}>✊ AKCEPTUJĘ WYROK</button>
            <a href="/polityka-prywatnosci" style={{
              padding:'13px 16px', border:'1px solid rgba(255,60,0,.2)', borderRadius:3,
              background:'transparent', fontFamily:"'Share Tech Mono',monospace", fontSize:11,
              color:'rgba(255,80,0,.4)', cursor:'pointer', textDecoration:'none',
              display:'flex', alignItems:'center',
            }}>Czytaj więcej</a>
          </div>
        </div>
      </div>
      <style>{`@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>
    </>
  );
}
