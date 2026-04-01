import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Regulamin — Kurwomat',
  description: 'Regulamin korzystania z serwisu Kurwomat.pl',
};

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:24, letterSpacing:3, color:'#ff8800', margin:'28px 0 10px', borderBottom:'1px solid rgba(255,60,0,.2)', paddingBottom:6 }}>{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin:'0 0 12px' }}>{children}</p>;
}
function Legal({ title, children }: { title:string; children:React.ReactNode }) {
  return (
    <div style={{ minHeight:'100vh', background:'#060300', fontFamily:"'Oswald',sans-serif", paddingBottom:80 }}>
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse 60% 30% at 50% 0%,rgba(255,60,0,.06),transparent)', zIndex:0, pointerEvents:'none' }} />
      <div style={{ maxWidth:720, margin:'0 auto', padding:'40px 20px', position:'relative', zIndex:1 }}>
        <div style={{ height:5, background:'repeating-linear-gradient(45deg,#ff2200 0px,#ff2200 6px,#1a0800 6px,#1a0800 12px)', marginBottom:32, opacity:.7 }} />
        <h1 style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:48, letterSpacing:4, margin:'0 0 8px', background:'linear-gradient(180deg,#fff8e0,#ffaa00,#ff4400)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{title}</h1>
        <div style={{ color:'rgba(255,80,0,.3)', fontFamily:"'Share Tech Mono',monospace", fontSize:11, marginBottom:36, letterSpacing:2 }}>INSTYTUT WKURWU NARODOWEGO · OŚWIĘCIM</div>
        <div style={{ color:'rgba(255,200,150,.75)', fontSize:15, lineHeight:1.9 }}>{children}</div>
        <div style={{ height:5, background:'repeating-linear-gradient(45deg,#ff2200 0px,#ff2200 6px,#1a0800 6px,#1a0800 12px)', marginTop:40, opacity:.5 }} />
        <p style={{ color:'rgba(255,40,0,.2)', fontFamily:'monospace', fontSize:11, marginTop:16, textAlign:'center' }}>© {new Date().getFullYear()} Kurwomat.pl · Aplikacja satyryczna</p>
      </div>
    </div>
  );
}

export default function RegulaaminPage() {
  return (
    <Legal title="REGULAMIN">
      <P><strong style={{color:'#ff8800'}}>TL;DR:</strong> Aplikacja satyryczna. Nie nagrywamy. Stripe obsługuje płatności. Min. wpłata 2 PLN.</P>
      <H2>§1. Postanowienia Ogólne</H2>
      <P>Serwis Kurwomat.pl jest aplikacją satyryczną prowadzoną przez osobę fizyczną z Oświęcimia. Korzystanie z Serwisu oznacza akceptację Regulaminu.</P>
      <H2>§2. Charakter Serwisu</H2>
      <P>Kurwomat to narzędzie humorystyczno-satyryczne do zliczania przekleństw. Nie oceniamy poziomu kultury osobistej ani stosunku do szefa.</P>
      <H2>§3. Mikrofon</H2>
      <P>Funkcja mikrofonu działa <strong style={{color:'#ff8800'}}>wyłącznie lokalnie w przeglądarce</strong>. Żadne nagrania nie są wysyłane na serwery. Rejestrowany jest tylko fakt wykrycia słowa kluczowego (+1 do licznika).</P>
      <H2>§4. Lucky Shot</H2>
      <P>System nagrody za trafienie konkretnej kwoty. Nie jest hazardem – płacisz wybraną kwotę, nagroda to status premium, nie wypłata gotówki. Kwota 11.04 PLN jest zawsze aktywna.</P>
      <H2>§5. Płatności</H2>
      <P>Darowizny w sekcji &ldquo;Postaw Piwo&rdquo; są dobrowolne. Min. 2.00 PLN, max 1000 PLN. Obsługa przez Stripe Inc. Zwroty w ciągu 14 dni na admin@kurwomat.pl.</P>
      <H2>§6. Premium i Early Bird</H2>
      <P>Subskrypcja 9.99 PLN/msc – anulowanie w dowolnym momencie. Lifetime 49.99 PLN – bez zwrotu po 14 dniach.</P>
      <H2>§7. Odpowiedzialność</H2>
      <P>Nie odpowiadamy za: pęknięty ekran, utratę pracy po krzyknięciu KURWA na Zoom, pogorszenie relacji z szefem. <strong style={{color:'#ff8800'}}>To aplikacja satyryczna.</strong></P>
      <H2>§8. Zmiany</H2>
      <P>Zastrzegamy prawo do zmiany Regulaminu z 7-dniowym wyprzedzeniem.</P>
    </Legal>
  );
}
