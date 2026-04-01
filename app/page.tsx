import { Suspense } from 'react';
import type { Metadata } from 'next';
import KurwomatApp from '@/components/KurwomatApp';

export const metadata: Metadata = {
  title: 'Kurwomat – Kuźnia Wkurwu Narodowego 💥',
  description: 'Dołącz do narodowego licznika wkurwu! Tryb mikrofonu, Lucky Shot, ligi znajomych, mapa wkurwu Polski w czasie rzeczywistym.',
};

export default function HomePage() {
  return (
    <main>
      <Suspense fallback={<LoadingScreen />}>
        <KurwomatApp />
      </Suspense>
    </main>
  );
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#060300', fontFamily: "'Bebas Neue', Impact, sans-serif",
    }}>
      <div style={{ fontSize: 56, marginBottom: 16, filter: 'drop-shadow(0 0 20px rgba(255,80,0,.8))', animation: 'pulse 1s infinite' }}>⚡</div>
      <div style={{ fontSize: 40, letterSpacing: 6, color: '#ff6600', textShadow: '0 0 20px rgba(255,80,0,.6)' }}>KURWOMAT</div>
      <div style={{ fontSize: 12, color: '#3a2010', letterSpacing: 4, marginTop: 8, fontFamily: 'monospace' }}>ROZPALANIE KUŹNI...</div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  );
}
