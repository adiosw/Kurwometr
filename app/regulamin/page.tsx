// ══════════════════════════════════════════════════════
// SHARED LEGAL LAYOUT
// ══════════════════════════════════════════════════════
import type { Metadata } from 'next';

function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight:'100vh', background:'#060300', fontFamily:"'Oswald',sans-serif", paddingBottom:80 }}>
      <div style={{ position:'fixed', inset:0, background:'radial-gradient(ellipse 60% 30% at 50% 0%,rgba(255,60,0,.06),transparent)', zIndex:0, pointerEvents:'none' }} />
      <div style={{ maxWidth:720, margin:'0 auto', padding:'40px 20px', position:'relative', zIndex:1 }}>
        <div style={{ height:5, background:'repeating-linear-gradient(45deg,#ff2200 0px,#ff2200 6px,#1a0800 6px,#1a0800 12px)', marginBottom:32, opacity:.7 }} />
        <h1 style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:48, letterSpacing:4, margin:'0 0 8px',
          background:'linear-gradient(180deg,#fff8e0,#ffaa00,#ff4400)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{title}</h1>
        <div style={{ color:'rgba(255,80,0,.3)', fontFamily:"'Share Tech Mono',monospace", fontSize:11, marginBottom:36, letterSpacing:2 }}>
          INSTYTUT WKURWU NARODOWEGO · OŚWIĘCIM · {new Date().getFullYear()}
        </div>
        <div style={{ color:'rgba(255,200,150,.75)', fontSize:15, lineHeight:1.9, fontWeight:400 }}>{children}</div>
        <div style={{ height:5, background:'repeating-linear-gradient(45deg,#ff2200 0px,#ff2200 6px,#1a0800 6px,#1a0800 12px)', marginTop:40, opacity:.5 }} />
        <p style={{ color:'rgba(255,40,0,.2)', fontFamily:'monospace', fontSize:11, marginTop:16, textAlign:'center' }}>
          © {new Date().getFullYear()} Kurwomat.pl · Aplikacja satyryczna · Made in Oświęcim 🔥
        </p>
      </div>
    </div>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:24, letterSpacing:3, color:'#ff8800',
    margin:'28px 0 10px', borderBottom:'1px solid rgba(255,60,0,.2)', paddingBottom:6 }}>{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin:'0 0 12px' }}>{children}</p>;
}

// ══════════════════════════════════════════════════════
// app/regulamin/page.tsx
// ══════════════════════════════════════════════════════
export const regulaminMetadata: Metadata = {
  title: 'Regulamin — Kurwomat',
  description: 'Regulamin korzystania z serwisu Kurwomat.pl – dupo-chron dla obu stron.',
};

export function RegulaaminPage() {
  return (
    <LegalLayout title="REGULAMIN">
      <P><strong style={{color:'#ff8800'}}>TL;DR:</strong> To aplikacja satyryczna. Nie nagrywamy Cię. Stripe obsługuje płatności. Minimalna wpłata 2 PLN. Nie pozwamy się nawzajem.</P>
      <H2>§1. Postanowienia Ogólne</H2>
      <P>Serwis Kurwomat.pl (dalej "Serwis") jest aplikacją satyryczną prowadzoną przez osobę fizyczną z siedzibą w Oświęcimiu, Polska. Korzystanie z Serwisu oznacza akceptację niniejszego Regulaminu. Jeśli nie akceptujesz – zamknij kartę, wróć do Excela i udawaj, że tu nie byłeś.</P>
      <H2>§2. Charakter Serwisu</H2>
      <P>Kurwomat jest narzędziem humorystyczno-satyrycznym służącym do zliczania przekleństw. Nie mierzymy IQ użytkownika, poziomu kultury osobistej ani stosunku do szefa. Te dane są nieważne. Ważna jest liczba kliknięć.</P>
      <H2>§3. Mikrofon – To Ważne</H2>
      <P>Funkcja mikrofonu działa <strong style={{color:'#ff8800'}}>wyłącznie lokalnie w przeglądarce</strong>. Żadne nagrania audio nie są wysyłane nigdzie. Serwis rejestruje tylko fakt wykrycia słowa kluczowego (+1 do licznika). Dźwięk nie jest przechowywany, nie jest nagrywany, nie jest sprzedawany, nie jest słuchany przez developera w łazience. No chyba że powiesz coś naprawdę śmiesznego.</P>
      <H2>§4. Lucky Shot – System Hazardowy</H2>
      <P>System "Lucky Shot" to ukryty bonus za trafienie konkretnej kwoty podczas wpłaty. Nie jest to hazard w rozumieniu ustawy o grach hazardowych, ponieważ: (a) nie tracisz pieniędzy – płacisz kwotę, którą wybrałeś, (b) nagroda to status premium, a nie wypłata gotówki. Traktuj to jako bonus lojalnościowy dla uważnych.</P>
      <P>Kwota 11.04 PLN jest <em>zawsze</em> aktywna jako Lucky Shot Tier 1. Jest to Wielkanoc w każdy dzień roku.</P>
      <H2>§5. Płatności i Darowizny</H2>
      <P>Wpłaty w sekcji "Postaw Piwo" są dobrowolnymi darowiznami na utrzymanie infrastruktury. Minimalna kwota: 2.00 PLN (poniżej prowizja Stripe zjada wszystko). Maksymalna: 1000 PLN (serio, to dużo piwa). Płatności obsługuje Stripe Inc. Zwroty możliwe w ciągu 14 dni – napisz na admin@kurwomat.pl.</P>
      <H2>§6. Premium i Early Bird</H2>
      <P>Subskrypcja Premium (9.99 PLN/msc) może być anulowana w dowolnym momencie. Status Lifetime (49.99 PLN) jest dożywotni i nie podlega zwrotowi po 14 dniach. Early Bird to oferta dla pierwszych 100 zarejestrowanych użytkowników – przydział jest atomowy i odporny na wyścig warunków (race condition), więc nie próbuj hacku wielooknowego, bo i tak nie zadziała.</P>
      <H2>§7. Ograniczenie Odpowiedzialności</H2>
      <P>Serwis nie ponosi odpowiedzialności za: pęknięty ekran telefonu w wyniku zbyt agresywnego tapowania, utratę pracy po krzyknięciu KURWA w trybie mikrofonu podczas Zoom-a, pogorszenie relacji z szefem, kryzys małżeński spowodowany nadmiernym używaniem Serwisu w godzinach pracy ani za żadne inne skutki uboczne zbyt intensywnego korzystania z aplikacji. <strong style={{color:'#ff8800'}}>To jest aplikacja satyryczna. Traktuj ją jak terapię śmiechem.</strong></P>
      <H2>§8. Zmiany Regulaminu</H2>
      <P>Zastrzegamy prawo do zmiany Regulaminu z 7-dniowym wyprzedzeniem. Dalsze korzystanie z Serwisu = akceptacja zmian. Jak to wszyscy robimy z każdym innym regulaminem, który i tak nikt nie czyta.</P>
    </LegalLayout>
  );
}

// ══════════════════════════════════════════════════════
// app/polityka-prywatnosci/page.tsx
// ══════════════════════════════════════════════════════
export const prywatnosacMetadata: Metadata = {
  title: 'Polityka Prywatności — Kurwomat',
  description: 'Polityka prywatności Kurwomat.pl. RODO. Twoje dane. Nasze zobowiązania.',
};

export function PolitykaPrywatnosci() {
  return (
    <LegalLayout title="POLITYKA PRYWATNOŚCI">
      <P><strong style={{color:'#ff8800'}}>TL;DR:</strong> Zbieramy minimum. Nie sprzedajemy danych. Mikrofon działa lokalnie. Masz prawa. Używamy Supabase + Stripe + Vercel.</P>
      <H2>1. Administrator Danych</H2>
      <P>Administratorem Twoich danych osobowych jest operator Kurwomat.pl, Oświęcim, Polska. Kontakt: admin@kurwomat.pl. Inspektor Ochrony Danych: ten sam facet, który napisał cały regulamin o 2 w nocy w łazience.</P>
      <H2>2. Jakie Dane Zbieramy</H2>
      <P><strong style={{color:'#ff8800'}}>Dane konta (opcjonalne):</strong> adres e-mail, nazwa użytkownika. Rejestracja jest dobrowolna.</P>
      <P><strong style={{color:'#ff8800'}}>Dane statystyczne (anonimowe):</strong> liczba kliknięć, przybliżone miasto (z Geolocation API – tylko za Twoją zgodą), kontekst wkurwu (Praca/Dom), powód.</P>
      <P><strong style={{color:'#ff8800'}}>Dane techniczne:</strong> IP (przez Vercel – retencja 24h), cookies sesyjne.</P>
      <P><strong style={{color:'#ff8800'}}>NIE zbieramy:</strong> nagrań audio, pełnych danych karty płatniczej (Stripe), danych biometrycznych, historii przeglądania poza Serwisem.</P>
      <H2>3. Mikrofon – Szczegóły Techniczne</H2>
      <P>Web Speech API przetwarza audio <strong style={{color:'#ff8800'}}>wyłącznie lokalnie w przeglądarce lub w usłudze przeglądarki (Google Speech)</strong>. Kurwomat.pl nie ma dostępu do surowego strumienia audio. Serwis otrzymuje tylko wynik: "czy wykryto słowo kluczowe: tak/nie". Dźwięk nigdy nie trafia na nasze serwery. Przyrzekamy – sprawdź kod źródłowy na GitHubie jeśli nie wierzysz.</P>
      <H2>4. Cel i Podstawa Przetwarzania (RODO art. 6)</H2>
      <P>• Świadczenie usług Serwisu (art. 6 ust. 1 lit. b) · Statystyki globalne (art. 6 ust. 1 lit. f) · Obsługa płatności przez Stripe (art. 6 ust. 1 lit. b) · Push notifikacje za Twoją zgodą (art. 6 ust. 1 lit. a)</P>
      <H2>5. Pliki Cookies</H2>
      <P>Używamy: cookies sesyjnych (niezbędne, bez Twojej zgody) + cookies analitycznych Google Analytics 4 (za zgodą). Możesz zarządzać cookies w ustawieniach przeglądarki. Odrzucenie analytics nie wpływa na działanie Serwisu.</P>
      <H2>6. Podmioty Przetwarzające</H2>
      <P>• <strong>Supabase</strong> (baza danych, auth) – infrastruktura AWS eu-central-1, Frankfurt · <strong>Stripe Inc.</strong> (płatności) – zgodny z PCI DSS · <strong>Vercel Inc.</strong> (hosting) – edge network · <strong>Google</strong> (Analytics + Speech API) – za Twoją zgodą</P>
      <H2>7. Twoje Prawa (RODO)</H2>
      <P>Masz prawo do: dostępu do danych, sprostowania, usunięcia (prawo do bycia zapomnianym), przenoszenia, ograniczenia przetwarzania, sprzeciwu, niepodlegania zautomatyzowanym decyzjom, wniesienia skargi do UODO (uodo.gov.pl).</P>
      <P>Żądania kieruj na: admin@kurwomat.pl. Odpowiadamy w ciągu 30 dni.</P>
      <H2>8. Bezpieczeństwo</H2>
      <P>Połączenia szyfrowane SSL/TLS. Dostęp do danych chroniony Row Level Security (Supabase RLS). Hasła nigdy nie są widoczne – zarządza nimi Supabase Auth. Rate limiting na API chroni przed atakami. Robimy co możemy. Resztę zostawiamy Bogu i Supabase.</P>
      <H2>9. Retencja Danych</H2>
      <P>Dane konta: do usunięcia konta. Statystyki anonimowe: bezterminowo (są anonimowe). Logi IP: 24h (Vercel). Dane płatności: 5 lat (wymóg podatkowy). Dane po usunięciu konta: usuwane w ciągu 30 dni.</P>
    </LegalLayout>
  );
}

export default RegulaaminPage;
