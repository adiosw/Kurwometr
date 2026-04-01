'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useGlobalStats } from '@/hooks/useGlobalStats';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/lib/supabase';

// ── CONSTANTS ────────────────────────────────────────────────────────────────
const REASONS = ['Korki','Szef','Inflacja','Ceny Masła','ZUS','Pogoda','Internet','Sąsiad'];
const EXCLAMATIONS = ['KURWA!!!','JEZUS MARIA!','O MATKO!!!','ŁOOOO!!!','PIEEEEEE!!!','NO WEŹŻE!!!','SZLAG TO!!!','CHOLEEERA!!!','O K***A!!!','NIEMOŻLIWE!!!'];
const TITLES = [
  { min:0,  max:5,        emoji:'🧘', title:'MNICH BUDDYJSKI',   color:'#8a9aaa', nextAt:6  },
  { min:6,  max:20,       emoji:'🇵🇱', title:'TYPOWY POLAK',       color:'#d4a844', nextAt:21 },
  { min:21, max:50,       emoji:'🚌', title:'KIEROWCA ZTM',       color:'#e06030', nextAt:51 },
  { min:51, max:Infinity, emoji:'💥', title:'DYREKTOR KREATYWNY', color:'#ff2200', nextAt:null },
];
const TRIGGER_WORDS = ['kurwa','kurwe','kurwy','kurwę','pierdol','jebać','jebany','cholera','szlag','niemożliwe','spierdalaj','chuj','skurwiel'];
const CITY_INIT = [
  {city:'Warszawa',clicks:87420,lat:52.23,lng:21.01},{city:'Kraków',clicks:54210,lat:50.06,lng:19.94},
  {city:'Gdańsk',clicks:31840,lat:54.35,lng:18.64},{city:'Wrocław',clicks:42100,lat:51.10,lng:17.03},
  {city:'Poznań',clicks:28900,lat:52.40,lng:16.92},{city:'Łódź',clicks:35200,lat:51.75,lng:19.45},
  {city:'Katowice',clicks:29800,lat:50.26,lng:19.02},{city:'Szczecin',clicks:18400,lat:53.42,lng:14.55},
  {city:'Lublin',clicks:21300,lat:51.24,lng:22.56},{city:'Rzeszów',clicks:15600,lat:50.04,lng:21.99},
  {city:'Bydgoszcz',clicks:17800,lat:53.12,lng:18.00},{city:'Białystok',clicks:14200,lat:53.13,lng:23.16},
  {city:'Oświęcim',clicks:2137,lat:50.03,lng:19.21},
];

function getTitle(n: number) { return TITLES.find(t => n >= t.min && n <= t.max) || TITLES[0]; }

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function KurwomatApp() {
  // State
  const [panicMode, setPanicMode] = useState(false);
  const [today, setToday] = useState(() => {
    if (typeof window === 'undefined') return 0;
    const d = localStorage.getItem('kw_date');
    if (d !== new Date().toDateString()) {
      localStorage.setItem('kw_date', new Date().toDateString());
      localStorage.setItem('kw_today', '0');
      return 0;
    }
    return parseInt(localStorage.getItem('kw_today') || '0');
  });
  const [context, setContext] = useState<'PRACA'|'DOM'>('PRACA');
  const [reason, setReason] = useState('Korki');
  const [pressing, setPressing] = useState(false);
  const [shaking, setShaking] = useState(false);
  const [excl, setExcl] = useState('');
  const [showExcl, setShowExcl] = useState(false);
  const [tab, setTab] = useState<'stats'|'map'|'ranking'>('stats');
  const [showCert, setShowCert] = useState(false);
  const [cityStats, setCityStats] = useState(CITY_INIT);
  const [mapTooltip, setMapTooltip] = useState<{city:string;clicks:number}|null>(null);

  // Mic state
  const [micActive, setMicActive] = useState(false);
  const [micStatus, setMicStatus] = useState<'idle'|'listening'|'detected'|'error'>('idle');
  const [micCount, setMicCount] = useState(0);
  const [micTranscript, setMicTranscript] = useState('');
  const [micVolume, setMicVolume] = useState(0);
  const [detectedWord, setDetectedWord] = useState('');
  const recognitionRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const volumeRAF = useRef<number | null>(null);
  const micCooldown = useRef(false);

  // Hooks
  const { count: globalCount, increment } = useGlobalStats();
  const geo = useGeolocation();
  const { subscribed, subscribe } = usePushNotifications();
  const exclTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    localStorage.setItem('kw_today', String(today));
  }, [today]);

  useEffect(() => {
    supabase.from('city_stats').select('city,clicks,lat,lng').then(({ data }) => {
      if (data) setCityStats(data as any);
    });
    const ch = supabase.channel('city_rt')
      .on('postgres_changes', { event:'*', schema:'public', table:'city_stats' }, (p:any) => {
        if (p.new) setCityStats(prev => {
          const i = prev.findIndex(c => c.city === p.new.city);
          return i >= 0 ? prev.map((c,j) => j===i ? p.new : c) : [...prev, p.new];
        });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  // ── KURWA HANDLER ──
  const handleKurwa = useCallback(async (source: 'button'|'mic' = 'button') => {
    setToday(n => n + 1);
    setShaking(true); setTimeout(() => setShaking(false), 420);
    const e = EXCLAMATIONS[Math.floor(Math.random() * EXCLAMATIONS.length)];
    setExcl(e); setShowExcl(true);
    clearTimeout(exclTimer.current!);
    exclTimer.current = setTimeout(() => setShowExcl(false), 1000);
    if (navigator.vibrate) navigator.vibrate(source === 'mic' ? [100,30,100,30,200] : [80,20,50]);
    if (source === 'mic') setMicCount(n => n + 1);
    if (typeof window !== 'undefined' && (window as any).trackKurwa) (window as any).trackKurwa(source);
    await increment();
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      await fetch('/api/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ city: geo.city, lat: geo.lat, lng: geo.lng, context, reason }),
      });
    } catch {}
  }, [context, reason, geo, increment]);

  // ── MIC VOLUME MONITOR ──
  const startVolumeMonitor = (stream: MediaStream) => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    analyserRef.current = analyser;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a,b) => a+b, 0) / data.length;
      setMicVolume(Math.min(100, avg * 2.5));
      volumeRAF.current = requestAnimationFrame(tick);
    };
    tick();
  };

  // ── START MIC ──
  const startMic = useCallback(async () => {
    const SR = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setMicStatus('error'); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      startVolumeMonitor(stream);
      const rec = new SR();
      rec.lang = 'pl-PL';
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 3;
      rec.onstart = () => setMicStatus('listening');
      rec.onerror = (e: any) => { if (e.error !== 'no-speech') setMicStatus('error'); };
      rec.onresult = (e: any) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          for (let j = 0; j < e.results[i].length; j++) {
            const txt = e.results[i][j].transcript.toLowerCase().trim();
            setMicTranscript(txt);
            const found = TRIGGER_WORDS.find(w => txt.includes(w));
            if (found && !micCooldown.current) {
              micCooldown.current = true;
              setDetectedWord(found.toUpperCase() + '!!!');
              setMicStatus('detected');
              handleKurwa('mic');
              setTimeout(() => { micCooldown.current = false; setMicStatus('listening'); }, 800);
              break;
            }
          }
        }
      };
      rec.onend = () => { if (micActive) rec.start(); };
      rec.start();
      recognitionRef.current = rec;
      setMicActive(true);
    } catch (err: any) {
      setMicStatus('error');
    }
  }, [micActive, handleKurwa]);

  const stopMic = useCallback(() => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} recognitionRef.current = null; }
    if (micStreamRef.current) { micStreamRef.current.getTracks().forEach(t => t.stop()); micStreamRef.current = null; }
    if (volumeRAF.current) cancelAnimationFrame(volumeRAF.current);
    setMicActive(false); setMicStatus('idle'); setMicVolume(0); setMicTranscript('');
  }, []);

  useEffect(() => () => stopMic(), []);

  if (panicMode) return <PanicMode onReturn={() => setPanicMode(false)} />;

  const td = getTitle(today);
  const topCities = [...cityStats].sort((a,b) => b.clicks - a.clicks);
  const maxCity = topCities[0]?.clicks || 1;

  return (
    <div className={shaking ? 'kw-shake' : ''} style={{ minHeight:'100vh', minHeight:'100dvh', background:'#060300', overflowX:'hidden', position:'relative', fontFamily:"var(--font-oswald,'Oswald',sans-serif)" }}>
      <div className="forge-bg" />
      <div className="lava-cracks" />
      {/* Embers */}
      {['e1','e2','e3','e4','e5','e6','e7','e8'].map(c => <div key={c} className={`ember ${c}`} />)}

      {/* Corner buttons */}
      <button onClick={() => setPanicMode(true)} style={{ position:'fixed', top:14, right:14, zIndex:200, width:36, height:36, borderRadius:'50%', background:'rgba(0,40,100,.3)', border:'1px solid rgba(0,100,200,.3)', backdropFilter:'blur(8px)', cursor:'pointer', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', color:'#4a90d9' }}>💧</button>
      {!subscribed && (
        <button onClick={subscribe} style={{ position:'fixed', top:14, right:60, zIndex:200, width:36, height:36, borderRadius:'50%', background:'rgba(255,60,0,.15)', border:'1px solid rgba(255,80,0,.3)', backdropFilter:'blur(8px)', cursor:'pointer', fontSize:15, display:'flex', alignItems:'center', justifyContent:'center', color:'#ff6600' }}>🔔</button>
      )}

      <div style={{ maxWidth:480, margin:'0 auto', padding:'0 14px 120px', position:'relative', zIndex:10 }}>

        {/* HEADER */}
        <header style={{ textAlign:'center', paddingTop:36, paddingBottom:4 }}>
          <StripeBar />
          <div style={{ padding:'16px 0 12px', background:'linear-gradient(180deg,#120800,#0a0400)', borderLeft:'3px solid rgba(255,60,0,.3)', borderRight:'3px solid rgba(255,60,0,.3)' }}>
            <div style={{ fontSize:10, letterSpacing:7, color:'rgba(255,100,0,.55)', fontFamily:'var(--font-mono)', marginBottom:6 }}>● INSTYTUT WKURWU NARODOWEGO ●</div>
            <h1 style={{ margin:0, fontFamily:'var(--font-bebas,Impact,sans-serif)', fontSize:'clamp(62px,17vw,86px)', letterSpacing:8, lineHeight:.9,
              background:'linear-gradient(180deg,#fff8e0 0%,#ffaa00 30%,#ff4400 60%,#cc1100 100%)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', animation:'titleFlame 2.5s ease-in-out infinite' }}>
              KURWOMAT
            </h1>
            <div style={{ margin:'10px 0 0', display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
              <div style={{ height:1, flex:1, background:'linear-gradient(90deg,transparent,rgba(255,80,0,.4))' }} />
              <span style={{ fontSize:10, letterSpacing:4, color:'rgba(255,80,0,.45)', fontFamily:'var(--font-mono)' }}>KUŹNIA WKURWU</span>
              <div style={{ height:1, flex:1, background:'linear-gradient(90deg,rgba(255,80,0,.4),transparent)' }} />
            </div>
            <div style={{ fontSize:10, color:'rgba(255,60,0,.3)', letterSpacing:3, marginTop:6, fontFamily:'var(--font-mono)' }}>
              v3.0 • EDYCJA POLSKA{geo.city ? ` • 📍 ${geo.city.toUpperCase()}` : ''}
            </div>
          </div>
          <StripeBar />
        </header>

        {/* GLOBAL LED COUNTER */}
        <div className="panel" style={{ margin:'16px 0 14px', padding:'20px 16px', animation:'moltenPulse 3s ease-in-out infinite' }}>
          <div style={{ position:'absolute', top:14, right:16, display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:9, color:'rgba(255,60,0,.4)', fontFamily:'var(--font-mono)' }}>LIVE</span>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#ff2200', boxShadow:'0 0 8px #ff2200', animation:'pulse 1s infinite' }} />
          </div>
          <div style={{ fontSize:9, letterSpacing:5, color:'rgba(255,100,0,.4)', marginBottom:10, fontFamily:'var(--font-mono)' }}>◆ GLOBALNA LICZBA KURW ◆ POLSKA</div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:'clamp(36px,10vw,50px)', letterSpacing:6, color:'#ff7700', lineHeight:1, animation:'ledFlicker 8s infinite,counterGlow 2s ease-in-out infinite' }}>
            {globalCount.toLocaleString('pl-PL')}
          </div>
          <div style={{ marginTop:10, display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:9, color:'rgba(255,60,0,.25)', fontFamily:'var(--font-mono)', letterSpacing:2 }}>SYNC REALTIME · SUPABASE</span>
            <span style={{ fontSize:9, color:'rgba(255,80,0,.35)', fontFamily:'var(--font-mono)' }}>⟳ ~1s</span>
          </div>
        </div>

        {/* TITLE BADGE */}
        <div style={{ textAlign:'center', marginBottom:16 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, background:`linear-gradient(135deg,rgba(255,60,0,.1),rgba(255,100,0,.05))`, border:`1px solid ${td.color}44`, borderRadius:2, padding:'8px 20px' }}>
            <span style={{ fontSize:22 }}>{td.emoji}</span>
            <div>
              <div style={{ fontSize:7, letterSpacing:4, color:'rgba(255,100,0,.35)', fontFamily:'var(--font-mono)' }}>SZEWC LEVEL</div>
              <div style={{ fontSize:18, letterSpacing:3, color:td.color, fontFamily:'var(--font-bebas,Impact)', lineHeight:1 }}>{td.title}</div>
            </div>
          </div>
          {td.nextAt && (
            <div style={{ marginTop:8 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'rgba(255,80,0,.35)', fontFamily:'var(--font-mono)', marginBottom:4, padding:'0 2px' }}>
                <span>{td.title}</span><span>{Math.max(0,td.nextAt-today)} DO NASTĘPNEGO</span>
              </div>
              <div style={{ height:4, background:'#1a0800', borderRadius:2, overflow:'hidden', border:'1px solid rgba(255,60,0,.2)' }}>
                <div style={{ height:'100%', width:`${Math.min(((today-td.min)/(td.nextAt-td.min))*100,100)}%`, background:`linear-gradient(90deg,${td.color},#ff8800)`, borderRadius:2, transition:'width .5s' }} />
              </div>
            </div>
          )}
        </div>

        {/* CONTEXT + REASON */}
        <div className="panel" style={{ marginBottom:12, padding:0, overflow:'hidden' }}>
          <div style={{ padding:'8px 12px 6px' }}>
            <div style={{ fontSize:8, letterSpacing:5, color:'rgba(255,100,0,.3)', fontFamily:'var(--font-mono)', marginBottom:8 }}>SESJA WKURWU</div>
            <div style={{ display:'flex', gap:6 }}>
              {(['PRACA','DOM'] as const).map(c => (
                <button key={c} onClick={() => setContext(c)} style={{ flex:1, padding:'10px 8px', border:`1px solid ${context===c?'rgba(255,80,0,.5)':'rgba(255,60,0,.12)'}`, cursor:'pointer', borderRadius:2, fontFamily:'var(--font-bebas,Impact)', fontSize:18, letterSpacing:3, transition:'all .15s', background:context===c?'linear-gradient(180deg,#aa2200,#881500)':'linear-gradient(180deg,#1e1208,#140e06)', color:context===c?'#fff8e0':'rgba(255,80,0,.3)', boxShadow:context===c?'0 0 20px rgba(255,40,0,.4)':'none' }}>
                  {c==='PRACA'?'⚙️ PRACA':'🏠 DOM'}
                </button>
              ))}
            </div>
          </div>
          <StripeBar h={3} />
          <div style={{ padding:'8px 12px 10px' }}>
            <div style={{ fontSize:8, letterSpacing:5, color:'rgba(255,100,0,.3)', fontFamily:'var(--font-mono)', marginBottom:8 }}>POWÓD WKURWU</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {REASONS.map(r => (
                <button key={r} onClick={() => setReason(r)} style={{ padding:'5px 12px', border:`1px solid ${reason===r?'rgba(255,80,0,.5)':'rgba(255,60,0,.1)'}`, cursor:'pointer', borderRadius:2, fontFamily:'var(--font-oswald,Oswald)', fontWeight:500, fontSize:12, letterSpacing:1, transition:'all .1s', background:reason===r?'linear-gradient(180deg,#881500,#661000)':'#140e06', color:reason===r?'#ff8800':'rgba(255,80,0,.28)', boxShadow:reason===r?'0 0 12px rgba(255,40,0,.4)':'none' }}>{r}</button>
              ))}
            </div>
          </div>
        </div>

        {/* MINI COUNTERS */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
          {[
            { label:'MOJE DZIŚ', val:today, sub:context, color:'#ff3300' },
            { label:'🎤 GŁOSEM', val:micCount, sub:'MIKROFON', color:micCount>0?'#ff6600':'rgba(255,80,0,.2)' },
          ].map(p => (
            <div key={p.label} className="panel" style={{ padding:'12px', textAlign:'center' }}>
              <div style={{ fontSize:8, letterSpacing:4, color:'rgba(255,80,0,.3)', fontFamily:'var(--font-mono)', marginBottom:4 }}>{p.label}</div>
              <div style={{ fontFamily:'var(--font-mono)', fontSize:52, color:p.color, textShadow:p.val>0?`0 0 15px ${p.color}66`:'none', lineHeight:1 }}>{p.val}</div>
              <div style={{ fontSize:8, color:'rgba(255,60,0,.25)', fontFamily:'var(--font-mono)', marginTop:4, letterSpacing:2 }}>{p.sub}</div>
            </div>
          ))}
        </div>

        {/* THE DETONATOR */}
        <div style={{ position:'relative', textAlign:'center', margin:'8px 0 16px' }}>
          {showExcl && (
            <div style={{ position:'absolute', top:-58, left:'50%', zIndex:20, fontFamily:'var(--font-bebas,Impact)', fontSize:30, color:'#ff1100', whiteSpace:'nowrap', pointerEvents:'none', textShadow:'0 0 20px #ff2200', animation:'popUp 1s ease-out forwards' }}>{excl}</div>
          )}
          <div style={{ display:'inline-block', position:'relative', padding:18, background:'radial-gradient(circle,#2a1a08,#1a0e04,#0d0700)', borderRadius:'50%', border:'3px solid rgba(255,80,0,.2)', boxShadow:'0 0 0 6px rgba(255,60,0,.07),0 0 0 12px rgba(255,40,0,.03),0 0 50px rgba(255,60,0,.15)' }}>
            <div style={{ position:'absolute', inset:0, borderRadius:'50%', background:'conic-gradient(from 0deg,#3a2810 0deg,#5a4020 45deg,#2a1808 90deg,#4a3018 135deg,#2a1808 180deg,#5a4020 225deg,#2a1808 270deg,#4a3018 315deg,#3a2810 360deg)' }} />
            {[0,60,120,180,240,300].map(deg => {
              const r = deg*Math.PI/180, bx=Math.sin(r)*118, by=-Math.cos(r)*118;
              return <div key={deg} style={{ position:'absolute', width:8, height:8, borderRadius:'50%', background:'radial-gradient(circle at 35% 35%,#8a6a40,#2a1808)', border:'1px solid rgba(255,100,0,.25)', top:'50%', left:'50%', transform:`translate(${bx-4}px,${by-4}px)` }} />;
            })}
            <button
              onMouseDown={() => setPressing(true)}
              onMouseUp={() => { setPressing(false); handleKurwa('button'); }}
              onMouseLeave={() => setPressing(false)}
              onTouchStart={e => { e.preventDefault(); setPressing(true); }}
              onTouchEnd={e => { e.preventDefault(); setPressing(false); handleKurwa('button'); }}
              style={{ width:205, height:205, borderRadius:'50%', cursor:'pointer', border:'none', position:'relative', overflow:'hidden',
                background:pressing?'radial-gradient(circle at 50% 55%,#aa0f00,#770000,#440000)':'radial-gradient(circle at 38% 30%,#ff6600,#ee2200,#bb0000,#770000,#440000)',
                transform:pressing?'translateY(12px) scale(.945)':'translateY(0) scale(1)',
                transition:'transform .07s cubic-bezier(.34,1.56,.64,1), background .07s',
                animation:pressing?'none':'buttonGlow 2.5s ease-in-out infinite',
                userSelect:'none', WebkitUserSelect:'none' as any,
              }}>
              <div style={{ position:'absolute', top:'8%', left:'12%', width:'50%', height:'42%', background:'radial-gradient(ellipse,rgba(255,220,150,.33),transparent 70%)', borderRadius:'50%', pointerEvents:'none' }} />
              <div style={{ position:'absolute', inset:8, borderRadius:'50%', border:'1px solid rgba(255,150,80,.14)', pointerEvents:'none' }} />
              <div style={{ position:'relative', zIndex:1, padding:'0 20px' }}>
                <div style={{ fontFamily:'var(--font-bebas,Impact)', fontSize:33, color:'#fff8e0', letterSpacing:2, lineHeight:1, textShadow:'0 3px 8px rgba(0,0,0,.9)' }}>KURWA!</div>
                <div style={{ fontFamily:'var(--font-oswald,Oswald)', fontWeight:400, fontSize:12, letterSpacing:5, color:'rgba(255,220,150,.75)', marginTop:2 }}>KLIKNIJ</div>
              </div>
            </button>
          </div>
          <div style={{ marginTop:12, fontSize:10, color:'rgba(255,60,0,.25)', fontFamily:'var(--font-mono)', letterSpacing:2 }}>KLIKNIJ Z CAŁEJ SIŁY. TELEFON TO WYTRZYMA.</div>
        </div>

        {/* MIC BUTTON */}
        <div style={{ marginBottom:20 }}>
          <button onClick={() => micActive ? stopMic() : startMic()} style={{
            width:'100%', padding:'14px 16px', borderRadius:3, cursor:'pointer', position:'relative', overflow:'hidden',
            background:micActive?'linear-gradient(180deg,#660000,#440000)':'linear-gradient(180deg,#1e140a,#140e06)',
            border:`2px solid ${micActive?'rgba(255,40,0,.8)':'rgba(255,80,0,.25)'}`,
            boxShadow:micActive?'0 0 30px rgba(255,0,0,.5),0 0 60px rgba(255,20,0,.3)':'0 0 10px rgba(255,60,0,.1)',
            animation:micActive&&micStatus==='listening'?'micPulse 1.5s ease-in-out infinite':'none',
            transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12,
          }}>
            {micActive && [1,2,3].map(i => (
              <div key={i} style={{ position:'absolute', top:'50%', left:'50%', width:40, height:40, borderRadius:'50%', border:'2px solid rgba(255,40,0,.4)', animation:`micRing ${1.5+i*.4}s ease-out infinite ${i*.3}s`, pointerEvents:'none' }} />
            ))}
            <div style={{ display:'flex', alignItems:'center', gap:10, position:'relative', zIndex:1 }}>
              <div style={{ fontSize:28, filter:micActive?'drop-shadow(0 0 8px rgba(255,40,0,.9))':'none' }}>🎤</div>
              <div>
                <div style={{ fontFamily:'var(--font-bebas,Impact)', fontSize:18, letterSpacing:3, color:micActive?'#fff8e0':'rgba(255,80,0,.5)', lineHeight:1 }}>
                  {micActive?(micStatus==='detected'?'ZŁAPANO!!!':'SŁUCHAM...'):'TRYB MIKROFONU'}
                </div>
                <div style={{ fontSize:9, color:micActive?'rgba(255,150,80,.7)':'rgba(255,60,0,.25)', fontFamily:'var(--font-mono)', marginTop:2, letterSpacing:1 }}>
                  {micActive
                    ? (micStatus==='error'?'BRAK DOSTĘPU':micStatus==='detected'?`WYKRYTO: ${detectedWord}`:micTranscript?`"${micTranscript.slice(-40)}"` :'Powiedz KURWA...')
                    : 'Automatycznie wykrywa przekleństwa · Speech API'}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:3, position:'relative', zIndex:1 }}>
              {micActive && micStatus!=='error' ? (
                [...Array(8)].map((_,i) => (
                  <div key={i} style={{ width:3, borderRadius:2, minHeight:3, maxHeight:28,
                    height:`${Math.max(3,Math.min(28,(micVolume/100)*28*(0.3+Math.sin(i*0.9+Date.now()/200)*0.7)))}px`,
                    background:`rgba(255,${80+i*15},0,${.4+i*.05})`, transition:'height .06s',
                    boxShadow:micStatus==='detected'?'0 0 6px rgba(255,50,0,.8)':'none' }} />
                ))
              ) : (
                <div style={{ fontFamily:'var(--font-bebas,Impact)', fontSize:22, color:micActive?'#ff2200':'rgba(255,60,0,.3)' }}>{micActive?'■':'▶'}</div>
              )}
            </div>
          </button>
          {micStatus==='detected' && (
            <div style={{ marginTop:4, textAlign:'center', fontFamily:'var(--font-bebas,Impact)', fontSize:14, color:'#ff4400', letterSpacing:3 }}>
              +1 ZAREJESTROWANO GŁOSOWO 🎤
            </div>
          )}
        </div>

        {/* TABS */}
        <StripeBar />
        <div style={{ display:'flex', background:'#0d0700', borderLeft:'1px solid rgba(255,60,0,.18)', borderRight:'1px solid rgba(255,60,0,.18)' }}>
          {([['stats','📊 STATS'],['map','🗺️ MAPA'],['ranking','🏆 TOP']] as const).map(([k,l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ flex:1, padding:'12px 4px', background:'none', border:'none', borderBottom:tab===k?'3px solid #ff3300':'3px solid transparent', color:tab===k?'#ff6600':'rgba(255,80,0,.27)', fontFamily:'var(--font-mono)', fontSize:11, letterSpacing:2, cursor:'pointer', transition:'all .15s', textShadow:tab===k?'0 0 10px rgba(255,80,0,.5)':'none' }}>{l}</button>
          ))}
        </div>
        <StripeBar />

        {/* TAB CONTENT */}
        {tab==='stats' && <StatsTab today={today} micCount={micCount} onShare={() => setShowCert(true)} />}
        {tab==='map'   && <MapTab cityStats={cityStats} tooltip={mapTooltip} setTooltip={setMapTooltip} maxCity={maxCity} topCities={topCities} />}
        {tab==='ranking' && <RankingTab topCities={topCities} maxCity={maxCity} />}
      </div>

      {showCert && <CertModal count={today} micCount={micCount} onClose={() => setShowCert(false)} />}
    </div>
  );
}

// ── SHARED UI COMPONENTS ─────────────────────────────────────────────────────
function StripeBar({ h=5 }: { h?: number }) {
  return <div style={{ height:h, background:'repeating-linear-gradient(45deg,#ff2200 0px,#ff2200 6px,#1a0800 6px,#1a0800 12px)', opacity:.65, flexShrink:0 }} />;
}

// ── STATS TAB ────────────────────────────────────────────────────────────────
function StatsTab({ today, micCount, onShare }: { today:number; micCount:number; onShare:()=>void }) {
  const hist = [12,8,25,15,30,18,today];
  const maxH = Math.max(...hist, 1);
  const days = ['Pn','Wt','Śr','Cz','Pt','So','Nd'];
  return (
    <div style={{ paddingTop:16 }} className="kw-slide">
      <div className="panel" style={{ padding:16, marginBottom:12 }}>
        <div style={{ fontSize:9, letterSpacing:5, color:'rgba(255,100,0,.35)', fontFamily:'var(--font-mono)', marginBottom:14 }}>◆ HISTORIA TYGODNIA</div>
        <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:80 }}>
          {hist.map((v,i) => { const h=Math.max(4,(v/maxH)*74),isT=i===6; return (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ width:'100%', height:h, borderRadius:'2px 2px 0 0', background:isT?'linear-gradient(0deg,#ff2200,#ff8800)':'#1e1208', boxShadow:isT?'0 0 16px rgba(255,80,0,.65)':'none', transition:'height .4s ease', border:`1px solid ${isT?'rgba(255,80,0,.4)':'rgba(255,60,0,.08)'}` }} />
              <span style={{ fontSize:8, color:isT?'#ff6600':'rgba(255,60,0,.22)', fontFamily:'var(--font-mono)' }}>{days[i]}</span>
            </div>
          );})}
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        {[
          { label:'MINUTY FRUSTRACJI', val:`${(today*2.3).toFixed(0)}m` },
          { label:'🎤 GŁOSEM', val:`${micCount} (${today>0?Math.round(micCount/today*100):0}%)` },
          { label:'INDEKS STRESU', val:`${Math.min(100,today*2)}%` },
          { label:'REKORD POLSKI', val:'247 💥' },
        ].map(s => (
          <div key={s.label} className="panel" style={{ padding:'10px 12px' }}>
            <div style={{ fontSize:8, color:'rgba(255,80,0,.3)', letterSpacing:2, fontFamily:'var(--font-mono)', marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:22, color:'#ff6600', fontFamily:'var(--font-bebas,Impact)', textShadow:'0 0 10px rgba(255,80,0,.4)' }}>{s.val}</div>
          </div>
        ))}
      </div>
      <button onClick={onShare} style={{ width:'100%', padding:16, border:'1px solid rgba(255,60,0,.4)', cursor:'pointer', borderRadius:2, background:'linear-gradient(180deg,#881500,#661000)', fontFamily:'var(--font-bebas,Impact)', fontSize:22, letterSpacing:4, color:'#ff8800', boxShadow:'0 0 30px rgba(255,40,0,.3)' }}>🔥 PODZIEL SIĘ WYNIKIEM</button>
    </div>
  );
}

// ── MAP TAB ──────────────────────────────────────────────────────────────────
const CITY_POS: Record<string,{x:number;y:number}> = {
  'Szczecin':{x:13,y:10},'Gdańsk':{x:52,y:7},'Bydgoszcz':{x:37,y:20},'Poznań':{x:24,y:29},
  'Warszawa':{x:65,y:33},'Łódź':{x:48,y:44},'Wrocław':{x:29,y:54},'Białystok':{x:80,y:20},
  'Lublin':{x:76,y:50},'Katowice':{x:43,y:70},'Kraków':{x:54,y:72},'Rzeszów':{x:72,y:75},'Oświęcim':{x:47,y:73},
};

function MapTab({ cityStats, tooltip, setTooltip, maxCity, topCities }: any) {
  return (
    <div style={{ paddingTop:16 }} className="kw-slide">
      <div style={{ fontSize:9, letterSpacing:5, color:'rgba(255,100,0,.35)', fontFamily:'var(--font-mono)', marginBottom:12 }}>◆ MAPA WKURWU · POLSKA REALTIME</div>
      <div className="panel" style={{ padding:14, marginBottom:12, position:'relative' }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex:1, background:'repeating-linear-gradient(0deg,transparent 0px,transparent 4px,rgba(255,60,0,.014) 4px,rgba(255,60,0,.014) 5px)', borderRadius:3 }} />
        <svg viewBox="0 0 300 270" style={{ width:'100%', height:'auto', display:'block' }}>
          <defs>
            <filter id="g1"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="g2"><feGaussianBlur stdDeviation="7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <polygon points="40,28 48,20 58,16 68,10 80,14 96,8 112,12 128,10 142,6 156,10 165,16 172,12 178,22 182,30 178,40 176,48 178,56 174,64 170,72 164,78 158,86 150,91 140,94 130,96 120,93 110,97 100,95 92,90 86,82 80,74 76,66 74,58 76,50 72,42 68,34 72,28" fill="#120800" stroke="rgba(255,80,0,.3)" strokeWidth="1.5" strokeLinejoin="round"/>
          {cityStats.map((city: any, i: number) => {
            const pos = CITY_POS[city.city]; if (!pos) return null;
            const intensity = city.clicks/maxCity, cx=(pos.x/100)*220+40, cy=(pos.y/100)*210+16, r=5+intensity*28;
            return (
              <g key={i}>
                <circle cx={cx} cy={cy} r={r*2.5} fill={`rgba(255,${Math.floor(40+intensity*120)},0,${.04+intensity*.1})`}/>
                <circle cx={cx} cy={cy} r={r*1.5} fill={`rgba(255,${Math.floor(60+intensity*140)},0,${.1+intensity*.22})`}/>
                <circle cx={cx} cy={cy} r={r} fill={`rgba(255,${Math.floor(80+intensity*160)},0,${.22+intensity*.48})`} filter={intensity>.5?"url(#g1)":undefined}/>
                <circle cx={cx} cy={cy} r={Math.max(2.5,r*.38)} fill={intensity>.75?"#fff8e0":intensity>.45?"#ff8800":"#ff4400"} filter="url(#g2)" style={{ cursor:'pointer', animation:intensity>.7?'heatPulse 1.8s infinite':undefined }}
                  onMouseEnter={() => setTooltip({city:city.city,clicks:city.clicks})} onMouseLeave={() => setTooltip(null)}/>
                <text x={cx} y={cy+r+11} textAnchor="middle" fill={intensity>.5?"rgba(255,120,0,.55)":"rgba(255,80,0,.28)"} fontSize={intensity>.7?8:6.5} fontFamily="monospace">{city.city}</text>
              </g>
            );
          })}
        </svg>
        {tooltip && (
          <div style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg,#200800,#140500)', border:'1px solid rgba(255,80,0,.4)', borderRadius:2, padding:'8px 18px', textAlign:'center', zIndex:20, pointerEvents:'none' }}>
            <div style={{ fontFamily:'var(--font-bebas,Impact)', fontSize:16, color:'#ff8800', letterSpacing:2 }}>{tooltip.city}</div>
            <div style={{ fontSize:12, color:'rgba(255,80,0,.65)', fontFamily:'var(--font-mono)' }}>{tooltip.clicks.toLocaleString('pl-PL')} KURW</div>
          </div>
        )}
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:14, justifyContent:'center' }}>
        {[['#ff2200','SPOKÓJ'],['#ff6600','WKURW'],['#ffaa00','MEGA'],['#fff8e0','MAX']].map(([c,l]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:c, boxShadow:`0 0 5px ${c}` }} />
            <span style={{ fontSize:8, color:'rgba(255,80,0,.35)', fontFamily:'var(--font-mono)' }}>{l}</span>
          </div>
        ))}
      </div>
      {topCities.slice(0,5).map((city: any, i: number) => (
        <div key={city.city} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', marginBottom:6, background:i===0?'linear-gradient(90deg,#220800,#140500)':'#120800', border:`1px solid ${i===0?'rgba(255,60,0,.4)':'rgba(255,40,0,.14)'}`, borderRadius:2 }}>
          <span style={{ fontSize:16, minWidth:24 }}>{['🥇','🥈','🥉','4.','5.'][i]}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--font-bebas,Impact)', fontSize:15, color:i===0?'#ff8800':i<3?'#ff6600':'rgba(255,80,0,.45)', letterSpacing:1 }}>{city.city}</div>
            <div style={{ height:3, background:'#1a0800', borderRadius:1, marginTop:3 }}><div style={{ height:'100%', width:`${(city.clicks/maxCity)*100}%`, background:i===0?'linear-gradient(90deg,#ff2200,#ff8800)':'rgba(255,60,0,.35)', borderRadius:1 }} /></div>
          </div>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:i===0?'#ff6600':'rgba(255,60,0,.35)' }}>{city.clicks.toLocaleString('pl-PL')}</span>
        </div>
      ))}
    </div>
  );
}

// ── RANKING TAB ──────────────────────────────────────────────────────────────
const REASONS_DATA = [{name:'Korki',count:84200},{name:'Szef',count:71400},{name:'Inflacja',count:62300},{name:'Ceny Masła',count:58100},{name:'ZUS',count:44700},{name:'Pogoda',count:31200},{name:'Internet',count:28900},{name:'Sąsiad',count:19400}];

function RankingTab({ topCities, maxCity }: any) {
  const maxR = REASONS_DATA[0].count;
  return (
    <div style={{ paddingTop:16 }} className="kw-slide">
      <div style={{ fontSize:9, letterSpacing:5, color:'rgba(255,100,0,.35)', fontFamily:'var(--font-mono)', marginBottom:12 }}>🏆 TOP MIASTA</div>
      {topCities.slice(0,8).map((city: any, i: number) => (
        <div key={city.city} style={{ display:'flex', alignItems:'center', padding:'10px 12px', marginBottom:6, background:i===0?'linear-gradient(90deg,#220800,#140500)':'#120800', border:`1px solid ${i===0?'rgba(255,80,0,.5)':'rgba(255,40,0,.14)'}`, borderRadius:2 }}>
          <span style={{ fontSize:18, minWidth:28 }}>{['🥇','🥈','🥉'][i] || <span style={{ fontFamily:'var(--font-mono)', color:'rgba(255,60,0,.28)', fontSize:12 }}>{i+1}.</span>}</span>
          <div style={{ flex:1, marginLeft:8 }}>
            <div style={{ fontFamily:'var(--font-bebas,Impact)', fontSize:16, letterSpacing:1, color:i===0?'#ff8800':i<3?'#ff6600':'rgba(255,80,0,.4)', marginBottom:4 }}>{city.city}</div>
            <div style={{ height:3, background:'#1a0800', borderRadius:1 }}><div style={{ height:'100%', width:`${(city.clicks/maxCity)*100}%`, background:i===0?'linear-gradient(90deg,#ff2200,#ff8800)':'rgba(255,60,0,.32)', borderRadius:1 }} /></div>
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:i===0?'#ff6600':'rgba(255,60,0,.35)', marginLeft:10, textAlign:'right' }}>{city.clicks.toLocaleString('pl-PL')}<div style={{ fontSize:8, color:'rgba(255,40,0,.2)' }}>KURW</div></div>
        </div>
      ))}
      <div style={{ fontSize:9, letterSpacing:5, color:'rgba(255,100,0,.35)', fontFamily:'var(--font-mono)', margin:'20px 0 12px' }}>💢 TOP POWODY</div>
      {REASONS_DATA.map((r,i) => (
        <div key={r.name} style={{ marginBottom:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
            <span style={{ fontFamily:'var(--font-oswald,Oswald)', fontWeight:500, fontSize:13, color:i<3?'#ff8800':'rgba(255,80,0,.45)', letterSpacing:1 }}>{['🥇','🥈','🥉'][i]||`${i+1}.`} {r.name}</span>
            <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'#ff6600' }}>{r.count.toLocaleString('pl-PL')}</span>
          </div>
          <div style={{ height:4, background:'#1a0800', borderRadius:2, border:'1px solid rgba(255,40,0,.1)' }}>
            <div style={{ height:'100%', width:`${(r.count/maxR)*100}%`, background:i===0?'linear-gradient(90deg,#ff2200,#ff8800)':`rgba(255,${40+i*5},0,${.55-i*.05})`, borderRadius:2, boxShadow:i===0?'0 0 10px rgba(255,80,0,.5)':'none', transition:'width .6s ease' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── CERT MODAL ───────────────────────────────────────────────────────────────
function CertModal({ count, micCount, onClose }: { count:number; micCount:number; onClose:()=>void }) {
  const cvRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = cvRef.current; if (!cv) return;
    const ctx = cv.getContext('2d')!;
    const W=cv.width, H=cv.height;
    const bg=ctx.createLinearGradient(0,0,W,H); bg.addColorStop(0,'#0e0400'); bg.addColorStop(.5,'#1e0800'); bg.addColorStop(1,'#080200');
    ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);
    for(let y=0;y<H;y+=4){ctx.fillStyle='rgba(255,80,0,.02)';ctx.fillRect(0,y,W,1);}
    const g=ctx.createRadialGradient(W/2,H*.6,0,W/2,H*.6,W*.55); g.addColorStop(0,'rgba(255,60,0,.2)'); g.addColorStop(1,'transparent'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    for(let x=0;x<W;x+=16){ctx.fillStyle='#ff2200';ctx.fillRect(x,0,8,8);ctx.fillStyle='#1a0800';ctx.fillRect(x+8,0,8,8);ctx.fillStyle='#ff2200';ctx.fillRect(x,H-8,8,8);ctx.fillStyle='#1a0800';ctx.fillRect(x+8,H-8,8,8);}
    ctx.strokeStyle='rgba(255,80,0,.6)';ctx.lineWidth=2.5;ctx.strokeRect(12,12,W-24,H-24);
    ctx.strokeStyle='rgba(255,60,0,.25)';ctx.lineWidth=1;ctx.strokeRect(18,18,W-36,H-36);
    [[18,18],[W-18,18],[18,H-18],[W-18,H-18]].forEach(([cx,cy])=>{const dx=cx<W/2?1:-1,dy=cy<H/2?1:-1;ctx.strokeStyle='rgba(255,100,0,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,cy+dy*18);ctx.lineTo(cx,cy);ctx.lineTo(cx+dx*18,cy);ctx.stroke();});
    ctx.textAlign='center';
    ctx.fillStyle='rgba(255,100,0,.5)';ctx.font="bold 10px 'Courier New'";ctx.fillText('INSTYTUT WKURWU NARODOWEGO',W/2,46);
    ctx.strokeStyle='rgba(255,80,0,.3)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(24,54);ctx.lineTo(W-24,54);ctx.stroke();
    ctx.shadowColor='#ff4400';ctx.shadowBlur=20;ctx.fillStyle='#fff8e0';ctx.font="bold 44px 'Bebas Neue',Impact";ctx.fillText('KURWOMAT',W/2,96);ctx.shadowBlur=0;
    ctx.fillStyle='rgba(255,60,0,.35)';ctx.font="12px 'Courier New'";ctx.fillText('NINIEJSZYM ZAŚWIADCZA ŻE DZIŚ PADŁO',W/2,124);
    ctx.shadowColor='#ff2200';ctx.shadowBlur=50;ctx.fillStyle='#ff2200';ctx.font="bold 110px 'Bebas Neue',Impact";ctx.fillText(String(count),W/2,242);ctx.shadowBlur=0;
    ctx.fillStyle='#ff8800';ctx.font="bold 22px 'Bebas Neue',Impact";ctx.shadowColor='#ff6600';ctx.shadowBlur=10;ctx.fillText('CERTYFIKOWANYCH KURW',W/2,268);ctx.shadowBlur=0;
    if(micCount>0){ctx.fillStyle='rgba(255,100,0,.5)';ctx.font="11px 'Courier New'";ctx.fillText(`W TYM GŁOSEM: ${micCount}`,W/2,290);}
    const td=getTitle(count);ctx.fillStyle=td.color;ctx.font="12px 'Courier New'";ctx.fillText(`TYTUŁ: ${td.title}`,W/2,(micCount>0?310:292));
    ctx.fillStyle='rgba(255,60,0,.3)';ctx.font="10px 'Courier New'";ctx.fillText(new Date().toLocaleDateString('pl-PL',{weekday:'long',year:'numeric',month:'long',day:'numeric'}),W/2,H-28);
    ctx.save();ctx.translate(W-74,H-82);ctx.rotate(-.28);
    ctx.strokeStyle='rgba(255,80,0,.7)';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,52,0,Math.PI*2);ctx.stroke();
    ctx.fillStyle='rgba(255,100,0,.85)';ctx.font="bold 8px 'Courier New'";ctx.textAlign='center';ctx.fillText('ZATWIERDZONE',0,-18);
    ctx.font="bold 15px 'Bebas Neue',Impact";ctx.fillStyle='#ff4400';ctx.fillText('★ IWN ★',0,5);
    ctx.font="bold 8px 'Courier New'";ctx.fillStyle='rgba(255,80,0,.6)';ctx.fillText('2025',0,22);ctx.restore();
    ctx.textAlign='center';ctx.fillStyle='rgba(255,40,0,.2)';ctx.font="9px 'Courier New'";ctx.fillText('kurwomat.pl • Kuźnia Wkurwu • v3.0',W/2,H-14);
  },[count,micCount]);

  const share = async () => {
    const cv = cvRef.current; if (!cv) return;
    cv.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `kurwomat-${count}.png`, { type:'image/png' });
      if (navigator.share && navigator.canShare({ files:[file] })) {
        await navigator.share({ title:`Kurwomat – ${count} kurw dzisiaj!`, text:`Mój wynik dnia: ${count} kurw. Tytuł: ${getTitle(count).title} 💥`, files:[file] });
      } else {
        const a = document.createElement('a'); a.download=`kurwomat-${count}.png`; a.href=cv.toDataURL(); a.click();
      }
    },'image/png');
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:'rgba(0,0,0,.95)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:16, overflowY:'auto' }}>
      <canvas ref={cvRef} width={440} height={370} style={{ maxWidth:'100%', borderRadius:4, boxShadow:'0 0 80px rgba(255,50,0,.5)' }} />
      <div style={{ display:'flex', gap:10, marginTop:18, flexWrap:'wrap', justifyContent:'center' }}>
        <button onClick={share} style={{ padding:'12px 22px', borderRadius:2, background:'linear-gradient(180deg,#881500,#661000)', border:'1px solid rgba(255,60,0,.4)', color:'#ff8800', fontFamily:"'Bebas Neue',Impact", fontSize:18, letterSpacing:3, cursor:'pointer' }}>📤 UDOSTĘPNIJ</button>
        <button onClick={onClose} style={{ padding:'12px 18px', borderRadius:2, background:'#120800', border:'1px solid rgba(255,40,0,.2)', color:'rgba(255,60,0,.4)', fontFamily:'monospace', fontSize:13, cursor:'pointer' }}>✕ ZAMKNIJ</button>
      </div>
    </div>
  );
}

// ── PANIC MODE ───────────────────────────────────────────────────────────────
function PanicMode({ onReturn }: { onReturn: () => void }) {
  const [water, setWater] = useState(0);
  const [taps, setTaps] = useState(0);
  const [last, setLast] = useState(0);
  const goal = 2000, pct = Math.min((water/goal)*100,100), segs=10, filled=Math.round((pct/100)*segs);
  const add = (ml: number) => { setWater(w => Math.min(w+ml,goal*2)); if(navigator.vibrate)navigator.vibrate(20); };
  const logo = () => { const now=Date.now(),n=now-last<500?taps+1:1; setTaps(n); setLast(now); if(n>=5)onReturn(); };
  return (
    <div style={{ fontFamily:'system-ui,sans-serif', minHeight:'100vh', background:'linear-gradient(180deg,#e8f4fd,#d6eaf8,#c5e3f7)', color:'#1a5276', padding:'0 0 40px' }}>
      <div style={{ background:'linear-gradient(180deg,#2980b9,#2471a3)', padding:'20px 20px 24px', textAlign:'center', boxShadow:'0 4px 20px rgba(41,128,185,.3)' }}>
        <div onClick={logo} style={{ cursor:'default', userSelect:'none', display:'inline-block' }}><div style={{ fontSize:40, marginBottom:6 }}>💧</div></div>
        <h1 style={{ margin:0, fontSize:26, fontWeight:300, color:'#fff', letterSpacing:2 }}>Licznik Wody</h1>
        {taps>1&&<p style={{ margin:'6px 0 0', fontSize:10, color:'rgba(255,255,255,.4)' }}>{5-taps} tapnięć do powrotu...</p>}
      </div>
      <div style={{ maxWidth:420, margin:'0 auto', padding:'24px 20px' }}>
        <div style={{ background:'#fff', borderRadius:20, padding:'28px 24px', marginBottom:20, boxShadow:'0 8px 32px rgba(41,128,185,.12)', textAlign:'center' }}>
          <svg width={140} height={140} viewBox="0 0 140 140"><circle cx={70} cy={70} r={58} fill="none" stroke="#ebf5fb" strokeWidth={12}/><circle cx={70} cy={70} r={58} fill="none" stroke="#2980b9" strokeWidth={12} strokeLinecap="round" strokeDasharray={`${2*Math.PI*58}`} strokeDashoffset={`${2*Math.PI*58*(1-pct/100)}`} transform="rotate(-90 70 70)" style={{ transition:'stroke-dashoffset .5s ease' }}/><text x={70} y={65} textAnchor="middle" fontSize={28} fontWeight={700} fill="#2471a3">{water}</text><text x={70} y={82} textAnchor="middle" fontSize={11} fill="#85c1e9">ml</text><text x={70} y={98} textAnchor="middle" fontSize={10} fill="#a9cce3">{pct.toFixed(0)}%</text></svg>
          <div style={{ fontSize:14, color:'#7fb3d3', marginTop:8 }}>Cel: <strong style={{ color:'#2471a3' }}>{goal} ml</strong></div>
        </div>
        <div style={{ background:'#fff', borderRadius:16, padding:'14px 18px', marginBottom:20 }}>
          <div style={{ display:'flex', gap:4 }}>{Array.from({length:segs}).map((_,i)=>(<div key={i} style={{ flex:1, height:20, borderRadius:4, background:i<filled?`hsl(${200+i*5},70%,${40+i*3}%)`:'#ebf5fb', transition:'background .3s' }}/>))}</div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
          {[['+150ml','Łyk',150],['+250ml','Szklanka',250],['+330ml','Butelka S',330],['+500ml','Butelka M',500]].map(([l,s,m])=>(
            <button key={String(l)} onClick={()=>add(m as number)} style={{ padding:'16px 12px', borderRadius:14, background:'linear-gradient(135deg,#2e86c1,#1a5276)', border:'none', color:'#fff', cursor:'pointer' }}>
              <div style={{ fontSize:18, fontWeight:700 }}>{l}</div><div style={{ fontSize:11, opacity:.75 }}>{s}</div>
            </button>
          ))}
        </div>
        <button onClick={onReturn} style={{ width:'100%', padding:14, borderRadius:12, background:'transparent', border:'1px solid #aed6f1', color:'#7fb3d3', cursor:'pointer', fontSize:13 }}>← Wróć</button>
      </div>
    </div>
  );
}

// ── CSS class for panel ───────────────────────────────────────────────────────
// (inject into globals.css or use inline — kept here for self-containment)
if (typeof document !== 'undefined' && !document.getElementById('panel-style')) {
  const style = document.createElement('style');
  style.id = 'panel-style';
  style.textContent = `.panel{background:linear-gradient(180deg,#1e140a 0%,#140e06 40%,#1a1208 100%);border:1px solid rgba(255,100,0,.22);border-radius:3px;position:relative;overflow:hidden;animation:borderBurn 3s ease-in-out infinite}.panel::before{content:'';position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(90deg,transparent 0px,transparent 3px,rgba(255,255,255,.006) 3px,rgba(255,255,255,.006) 4px)}.panel::after{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,150,0,.45),transparent);pointer-events:none}`;
  document.head.appendChild(style);
}
