// app/api/og/route.tsx
import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const count = searchParams.get('count') || '0';
  const rank = searchParams.get('rank') || 'MNICH BUDDYJSKI';
  const city = searchParams.get('city') || 'Polska';
  const league = searchParams.get('league') || '';

  return new ImageResponse(
    (
      <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center', position:'relative',
        background:'linear-gradient(135deg,#0a0300 0%,#1a0600 50%,#0a0200 100%)',
        fontFamily:'Impact, sans-serif' }}>

        {/* Top stripe */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:20, display:'flex',
          background:'repeating-linear-gradient(90deg,#ff2200 0px,#ff2200 30px,#1a0800 30px,#1a0800 60px)' }} />
        {/* Bottom stripe */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:20, display:'flex',
          background:'repeating-linear-gradient(90deg,#1a0800 0px,#1a0800 30px,#ff2200 30px,#ff2200 60px)' }} />

        {/* Glow */}
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% 50%,rgba(255,60,0,0.12),transparent)', display:'flex' }} />

        {/* IWN label */}
        <div style={{ fontSize:16, letterSpacing:6, color:'rgba(255,100,0,0.55)', marginBottom:12, display:'flex' }}>
          {league ? `🏆 LIGA: ${league.toUpperCase()}` : '● INSTYTUT WKURWU NARODOWEGO ●'}
        </div>

        {/* Title */}
        <div style={{ fontSize:88, letterSpacing:8, lineHeight:.9, display:'flex',
          background:'linear-gradient(180deg,#fff8e0 0%,#ffaa00 30%,#ff4400 60%,#cc1100 100%)',
          WebkitBackgroundClip:'text', color:'transparent' }}>
          KURWOMAT
        </div>

        {/* Count */}
        <div style={{ fontSize:80, color:'#ff3300', marginTop:16, display:'flex',
          textShadow:'0 0 40px rgba(255,50,0,0.8)' }}>
          {parseInt(count).toLocaleString('pl-PL')}
        </div>
        <div style={{ fontSize:22, color:'#ff8800', letterSpacing:6, display:'flex' }}>KURW DZIŚ</div>

        {/* Rank badge */}
        <div style={{ marginTop:20, padding:'8px 28px',
          border:'1px solid rgba(255,100,0,0.5)', background:'rgba(255,60,0,0.1)',
          fontSize:26, letterSpacing:3, color:'#ffaa00', display:'flex' }}>
          {rank}
        </div>

        <div style={{ marginTop:18, fontSize:18, color:'rgba(255,150,80,0.6)', letterSpacing:2, display:'flex' }}>
          kurwomat.pl · Sprawdź swój wynik!
        </div>

        <div style={{ position:'absolute', bottom:28, right:24, fontSize:14, color:'rgba(255,60,0,0.35)', display:'flex' }}>
          📍 {city}
        </div>
      </div>
    ),
    { width:1200, height:630 }
  );
}
