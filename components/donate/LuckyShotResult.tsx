'use client';
import { useState, useEffect, useRef } from 'react';

type Props = {
  result: { won: boolean; tier?: number };
  onClose: () => void;
};

// Randomly pick 1 of 5 animations for tier 1, special for tier 2
const ANIMATIONS = ['industrial_error', 'jackpot', 'nuclear', 'spawacz', 'para_buch'] as const;
type AnimType = typeof ANIMATIONS[number];

export default function LuckyShotResult({ result, onClose }: Props) {
  const [anim, setAnim] = useState<AnimType>('jackpot');
  const [phase, setPhase] = useState(0);
  const animRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!result.won) {
      // Small delay then show "thanks" message, then auto-close
      animRef.current = setTimeout(onClose, 100);
      return;
    }

    // Pick animation
    const picked = result.tier === 2 ? 'nuclear' : ANIMATIONS[Math.floor(Math.random() * ANIMATIONS.length)];
    setAnim(picked);

    // Haptic
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);

    // Phase sequence
    setPhase(1);
    animRef.current = setTimeout(() => setPhase(2), 2000);

    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, [result.won]);

  if (!result.won) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
    }} onClick={() => phase >= 2 && onClose()}>

      {/* ANIMATION LAYERS */}
      {anim === 'industrial_error' && <IndustrialError phase={phase} />}
      {anim === 'jackpot' && <JackpotAnim phase={phase} tier={result.tier!} />}
      {anim === 'nuclear' && <NuclearMeltdown phase={phase} />}
      {anim === 'spawacz' && <SpawaczAnim phase={phase} />}
      {anim === 'para_buch' && <ParaBuch phase={phase} tier={result.tier!} />}

      {/* Close hint */}
      {phase >= 2 && (
        <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center',
          fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: 'rgba(255,200,100,.5)',
          animation: 'pulse 1.5s infinite' }}>
          Kliknij aby zamknąć
        </div>
      )}

      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes shake{0%{transform:translate(0,0)}10%{transform:translate(-8px,6px) rotate(-1deg)}20%{transform:translate(8px,-5px) rotate(1deg)}30%{transform:translate(-6px,8px)}40%{transform:translate(7px,-7px)}50%{transform:translate(-5px,5px)}60%{transform:translate(6px,-4px)}70%{transform:translate(-4px,6px)}80%{transform:translate(5px,-3px)}100%{transform:translate(0,0)}}
        @keyframes legendBurn{0%{opacity:0;letter-spacing:2px;filter:brightness(0)}30%{opacity:.3;filter:brightness(.5) drop-shadow(0 0 20px #ff6600)}60%{opacity:.8;filter:brightness(1) drop-shadow(0 0 40px #ffaa00)}100%{opacity:1;letter-spacing:12px;filter:brightness(1.2) drop-shadow(0 0 60px #fff) drop-shadow(0 0 100px #ffaa00)}}
        @keyframes weldFlash{0%,100%{opacity:0}5%,15%,25%{opacity:1}10%,20%,30%{opacity:0}}
        @keyframes floatUp{0%{transform:translateY(0) rotate(var(--r));opacity:1}100%{transform:translateY(-120vh) rotate(calc(var(--r) + 360deg));opacity:0}}
        @keyframes goldDust{0%{transform:translateY(0) scale(1);opacity:.8}100%{transform:translateY(-80px) scale(.2);opacity:0}}
        @keyframes revealWhite{0%{background:white;opacity:1}100%{background:#0a0300;opacity:1}}
        @keyframes alarmPulse{0%,100%{background:rgba(255,0,0,.8)}50%{background:rgba(220,0,0,.3)}}
      `}</style>
    </div>
  );
}

// ── ANIMATION 1: Industrial Error ────────────────────────────────────────────
function IndustrialError({ phase }: { phase: number }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2,
      background: '#000',
      animation: phase === 1 ? 'shake .15s ease-in-out infinite' : 'none',
    }}>
      {/* Red alarm flashes */}
      <div style={{ position: 'absolute', inset: 0, animation: 'alarmPulse .4s ease-in-out infinite', zIndex: 0 }} />

      {/* Alarm stripes */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 12,
        background: 'repeating-linear-gradient(90deg,#ff0000 0px,#ff0000 20px,#000 20px,#000 40px)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 12,
        background: 'repeating-linear-gradient(90deg,#ff0000 0px,#ff0000 20px,#000 20px,#000 40px)' }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20 }}>
        <div style={{ fontSize: 80, animation: 'pulse .5s infinite' }}>⚠️</div>
        <div style={{ fontFamily: "'Bebas Neue',Impact,sans-serif", fontSize: 56, color: '#ff0000',
          textShadow: '0 0 30px #ff0000', letterSpacing: 8, textAlign: 'center' }}>
          ALERT!
        </div>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 18, color: '#ff4400', textAlign: 'center', lineHeight: 1.6 }}>
          WYKRYTO TRAFIENIE LUCKY SHOT!<br />
          <span style={{ color: '#ffcc00', fontSize: 14 }}>STATUS LEGEND AKTYWOWANY</span>
        </div>
        <div style={{ fontFamily: "'Bebas Neue',Impact,sans-serif", fontSize: 36, letterSpacing: 6,
          background: 'linear-gradient(90deg,#fff8e0,#ffaa00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'legendBurn 2s ease-out forwards', marginTop: 10 }}>
          LEGEND
        </div>
      </div>
    </div>
  );
}

// ── ANIMATION 2: Jackpot (rain of bottle caps) ──────────────────────────────
function JackpotAnim({ phase, tier }: { phase: number; tier: number }) {
  const caps = Array.from({ length: 30 }, (_, i) => ({
    emoji: ['🍺', '🍻', '💥', '⭐', '🏅'][i % 5],
    left: Math.random() * 100,
    delay: Math.random() * 2,
    rotation: Math.random() * 360,
    duration: 2 + Math.random() * 3,
  }));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2, background: 'linear-gradient(180deg,#0a0300,#1a0800)', overflow: 'hidden' }}>
      {/* Falling caps */}
      {caps.map((c, i) => (
        <div key={i} style={{
          position: 'absolute', top: -50, left: `${c.left}%`,
          fontSize: 32, animation: `floatUp ${c.duration}s ease-in ${c.delay}s infinite`,
          ['--r' as any]: `${c.rotation}deg`,
        }}>{c.emoji}</div>
      ))}

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
        <div style={{ fontFamily: "'Bebas Neue',Impact,sans-serif", fontSize: 24, color: '#ff8800', letterSpacing: 6 }}>
          🎰 LUCKY SHOT! 🎰
        </div>
        <div style={{ fontFamily: "'Bebas Neue',Impact,sans-serif", fontSize: 64, letterSpacing: 10,
          background: 'linear-gradient(180deg,#fff8e0,#ffaa00,#ff4400)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'legendBurn 2s ease-out forwards', textAlign: 'center' }}>
          LEGEND
        </div>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 14, color: 'rgba(255,200,100,.7)', textAlign: 'center', lineHeight: 1.8 }}>
          {tier === 2 ? '👑 LIFETIME LEGEND — DOŻYWOTNI STATUS!' : '⚡ LEGEND 30 DNI — AKTYWOWANO!'}<br />
          Kurwa wygrał! 🎉
        </div>
      </div>
    </div>
  );
}

// ── ANIMATION 3: Nuclear Meltdown (tier 2) ─────────────────────────────────
function NuclearMeltdown({ phase }: { phase: number }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2,
      background: phase === 1 ? '#ffffff' : 'linear-gradient(180deg,#0a0300,#1a0000)',
      transition: 'background 3s ease',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20 }}>
        {phase >= 1 && (
          <>
            <div style={{ fontSize: 72, animation: 'pulse 2s infinite' }}>☢️</div>
            <div style={{ fontFamily: "'Bebas Neue',Impact,sans-serif", fontSize: 72, letterSpacing: 12,
              background: 'linear-gradient(180deg,#fff8e0,#ffaa00,#ff4400,#cc1100)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              animation: 'legendBurn 4s ease-out forwards', textAlign: 'center', lineHeight: 1 }}>
              LIFETIME<br />LEGEND
            </div>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 13, color: 'rgba(255,200,100,.6)', textAlign: 'center', lineHeight: 1.8 }}>
              POZIOM KRYTYCZNY OSIĄGNIĘTY<br />
              DOŻYWOTNI STATUS LEGEND — AKTYWOWANO<br />
              <span style={{ color: '#ffcc00' }}>Jesteś częścią historii Kurwomatu 🔥</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── ANIMATION 4: Spawacz ─────────────────────────────────────────────────────
function SpawaczAnim({ phase }: { phase: number }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2, background: '#050200', overflow: 'hidden' }}>
      {/* Weld flashes */}
      {phase === 1 && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(150,200,255,.9)', animation: 'weldFlash .3s ease-in-out infinite', zIndex: 1 }} />
      )}

      <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20 }}>
        <div style={{ fontSize: 56 }}>⚡</div>
        <div style={{
          fontFamily: "'Bebas Neue',Impact,sans-serif", fontSize: 72, letterSpacing: 12,
          color: '#ffaa00', textShadow: '0 0 40px #ff8800, 0 0 80px #ff4400',
          animation: 'legendBurn 3s ease-out forwards',
          textDecoration: 'underline', textDecorationColor: 'rgba(255,150,0,.3)',
        }}>LEGEND</div>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 13, color: 'rgba(255,150,80,.6)', textAlign: 'center' }}>
          WYPALONO W STALI · STATUS AKTYWNY
        </div>
      </div>
    </div>
  );
}

// ── ANIMATION 5: Para Buch ────────────────────────────────────────────────────
function ParaBuch({ phase, tier }: { phase: number; tier: number }) {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    left: 20 + Math.random() * 60,
    delay: Math.random() * 1.5,
    size: 4 + Math.random() * 8,
  }));

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2, background: 'linear-gradient(180deg,#0a0300,#1a0800)', overflow: 'hidden' }}>
      {/* Gold particles */}
      {particles.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', bottom: '40%', left: `${p.left}%`,
          width: p.size, height: p.size, borderRadius: '50%',
          background: `rgba(255,${150+Math.random()*105|0},0,.8)`,
          boxShadow: `0 0 6px rgba(255,200,0,.8)`,
          animation: `goldDust ${1+Math.random()}s ease-out ${p.delay}s infinite`,
        }} />
      ))}

      <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20 }}>
        <div style={{ fontSize: 60, animation: 'pulse .8s infinite' }}>💨</div>
        <div style={{ fontFamily: "'Bebas Neue',Impact,sans-serif", fontSize: 64, letterSpacing: 10,
          background: 'linear-gradient(180deg,#fff8e0,#ffcc00,#ff8800)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'legendBurn 2.5s ease-out forwards' }}>
          LEGEND
        </div>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 13, color: 'rgba(255,200,100,.65)', textAlign: 'center', lineHeight: 1.8 }}>
          PARA BUCH! CIŚNIENIE PRZEKROCZONE!<br />
          {tier === 2 ? '👑 STATUS LIFETIME AKTYWOWANY' : '⚡ LEGEND 30 DNI AKTYWOWANY'}<br />
          <span style={{ color: '#ffaa00' }}>🎊 Złoty pył opada na Twoje konto</span>
        </div>
      </div>
    </div>
  );
}
