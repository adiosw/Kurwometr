import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Polityka Prywatności — Kurwomat',
  description: 'Polityka prywatności Kurwomat.pl. RODO. Twoje dane.',
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:24, letterSpacing:3, color:'#ff8800', margin:'28px 0 10px', borderBottom:'1px solid rgba(255,60,0,.2)', paddingBottom:6 }}>{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin:'0 0 12px' }}>{children}</p>;
}

export default function PolitykaPrywatnosci() {
  return (
    <div style={{ minHeight:'100vh', background:'#060300', fontFamily:"'Oswald',sans-serif", paddingBottom:80 }}>
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse 60% 30% at 50% 0%,rgba(255,60,0,.06),transparent)', zIndex:0, pointerEvents:'none' }} />
      <div style={{ maxWidth:720, margin:'0 auto', padding:'40px 20px', position:'relative', zIndex:1 }}>
        <div style={{ height:5, background:'repeating-linear-gradient(45deg,#ff2200 0px,#ff2200 6px,#1a0800 6px,#1a0800 12px)', marginBottom:32, opacity:.7 }} />
        <h1 style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:48, letterSpacing:4, margin:'0 0 8px', background:'linear-gradient(180deg,#fff8e0,#ffaa00,#ff4400)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>POLITYKA PRYWATNOŚCI</h1>
        <div style={{ color:'rgba(255,80,0,.3)', fontFamily:"'Share Tech Mono',monospace", fontSize:11, marginBottom:36, letterSpacing:2 }}>INSTYTUT WKURWU NARODOWEGO · OŚWIĘCIM</div>
        <div style={{ color:'rgba(255,200,150,.75)', fontSize:15, lineHeight:1.9 }}>
          <P><strong style={{color:'#ff8800'}}>TL;DR:</strong> Zbieramy minimum. Nie sprzedajemy danych. Mikrofon lokalny. Masz prawa RODO.</P>
          <H2>1. Administrator</H2>
          <P>Operator Kurwomat.pl, Oświęcim, Polska. Kontakt: admin@kurwomat.pl</P>
          <H2>2. Zbierane Dane</H2>
          <P><strong style={{color:'#ff8800'}}>Konto (opcjonalne):</strong> e-mail, nazwa użytkownika.</P>
          <P><strong style={{color:'#ff8800'}}>Statystyki (anonimowe):</strong> liczba kliknięć, miasto (Geolocation API – za zgodą), kontekst i powód wkurwu.</P>
          <P><strong style={{color:'#ff8800'}}>NIE zbieramy:</strong> nagrań audio, danych karty płatniczej, danych biometrycznych.</P>
          <H2>3. Mikrofon – Szczegóły</H2>
          <P>Web Speech API przetwarza audio <strong style={{color:'#ff8800'}}>wyłącznie lokalnie</strong>. Kurwomat.pl nie otrzymuje surowego dźwięku – tylko wynik: &ldquo;wykryto słowo kluczowe tak/nie&rdquo;. Nic nie jest nagrywane ani przesyłane.</P>
          <H2>4. Cel Przetwarzania (RODO art. 6)</H2>
          <P>Świadczenie usług (art. 6 ust. 1 lit. b) · Statystyki globalne (art. 6 ust. 1 lit. f) · Płatności Stripe (art. 6 ust. 1 lit. b) · Push za zgodą (art. 6 ust. 1 lit. a)</P>
          <H2>5. Cookies</H2>
          <P>Sesyjne (niezbędne) + analityczne Google Analytics 4 (za zgodą). Zarządzaj w ustawieniach przeglądarki.</P>
          <H2>6. Podmioty Przetwarzające</H2>
          <P>Supabase (AWS eu-central-1) · Stripe Inc. (PCI DSS) · Vercel Inc. · Google (Analytics + Speech API za zgodą)</P>
          <H2>7. Twoje Prawa (RODO)</H2>
          <P>Dostęp · Sprostowanie · Usunięcie · Przenoszenie · Sprzeciw · Skarga do UODO (uodo.gov.pl). Żądania: admin@kurwomat.pl, odpowiedź w 30 dni.</P>
          <H2>8. Bezpieczeństwo</H2>
          <P>SSL/TLS · Row Level Security (Supabase) · Rate limiting · Hasła zarządza Supabase Auth.</P>
          <H2>9. Retencja</H2>
          <P>Dane konta: do usunięcia konta · Statystyki anonimowe: bezterminowo · Logi IP: 24h · Dane płatności: 5 lat (wymóg podatkowy)</P>
        </div>
        <div style={{ height:5, background:'repeating-linear-gradient(45deg,#ff2200 0px,#ff2200 6px,#1a0800 6px,#1a0800 12px)', marginTop:40, opacity:.5 }} />
        <p style={{ color:'rgba(255,40,0,.2)', fontFamily:'monospace', fontSize:11, marginTop:16, textAlign:'center' }}>© {new Date().getFullYear()} Kurwomat.pl</p>
      </div>
    </div>
  );
}
