import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, Oswald, Share_Tech_Mono } from 'next/font/google';
import CookieBanner from '@/components/legal/CookieBanner';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';
import './globals.css';

const bebasNeue = Bebas_Neue({ weight:'400', subsets:['latin'], variable:'--font-bebas', display:'swap' });
const oswald = Oswald({ weight:['400','500','700'], subsets:['latin'], variable:'--font-oswald', display:'swap' });
const shareTechMono = Share_Tech_Mono({ weight:'400', subsets:['latin'], variable:'--font-mono', display:'swap' });

const BASE = process.env.NEXT_PUBLIC_URL || 'https://kurwomat.pl';

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: { default:'Kurwomat – Kuźnia Wkurwu Narodowego 💥', template:'%s — Kurwomat' },
  description: 'Dołącz do narodowego licznika wkurwu. Mierzymy poziom emocji w Polsce w czasie rzeczywistym! Tryb mikrofonu, Lucky Shot, rankingi, mapa Polski.',
  keywords: ['kurwomat','kurwometr','licznik przekleństw','polska','humor','wkurw','frustracja','mikrofon','lucky shot'],
  authors: [{ name:'Instytut Wkurwu Narodowego', url:BASE }],
  creator: 'Kurwomat.pl',
  robots: { index:true, follow:true, googleBot:{ index:true, follow:true } },
  manifest: '/manifest.json',
  appleWebApp: { capable:true, statusBarStyle:'black-translucent', title:'Kurwomat' },

  openGraph: {
    type: 'website', locale:'pl_PL', url:BASE, siteName:'Kurwomat',
    title: 'Kurwomat 💥 – Kuźnia Wkurwu Narodowego',
    description: 'Dołącz do narodowego licznika wkurwu! Mierzymy poziom emocji w Polsce w czasie rzeczywistym.',
    images: [{ url:`${BASE}/api/og?count=2137420&rank=TYPOWY+POLAK&city=Polska`, width:1200, height:630, alt:'Kurwomat – Globalny licznik wkurwu' }],
  },

  twitter: {
    card:'summary_large_image', site:'@kurwomat', creator:'@kurwomat',
    title: 'Kurwomat 💥 – Ile kurw dzisiaj?',
    description: 'Sprawdź swój poziom frustracji i porównaj z całą Polską!',
    images: [`${BASE}/api/og?count=2137420&rank=TYPOWY+POLAK`],
  },

  alternates: { canonical:BASE, languages:{ 'pl':BASE } },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
};

export const viewport: Viewport = {
  themeColor:'#ff2200', width:'device-width', initialScale:1,
  maximumScale:1, userScalable:false, viewportFit:'cover',
};

export default function RootLayout({ children }: { children:React.ReactNode }) {
  return (
    <html lang="pl" className={`${bebasNeue.variable} ${oswald.variable} ${shareTechMono.variable}`}>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context":"https://schema.org","@type":"WebApplication",
          "name":"Kurwomat","url":BASE,
          "description":"Globalny licznik wkurwu dla Polaków z trybem mikrofonu i Lucky Shot",
          "applicationCategory":"EntertainmentApplication",
          "operatingSystem":"Web, Android, iOS",
          "offers":{"@type":"Offer","price":"0","priceCurrency":"PLN"},
          "author":{"@type":"Person","name":"Developer z Oświęcimia"},
        })}} />
      </head>
      <body style={{ margin:0, padding:0, backgroundColor:'#060300', overscrollBehavior:'none', WebkitTapHighlightColor:'transparent' }}>
        <GoogleAnalytics />
        {children}
        <CookieBanner />
        <AppFooter />
        <script dangerouslySetInnerHTML={{ __html:`if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}` }} />
      </body>
    </html>
  );
}

function AppFooter() {
  return (
    <footer style={{ borderTop:'1px solid rgba(255,60,0,.15)', background:'#040100', padding:'24px 20px', fontFamily:"'Share Tech Mono',monospace", fontSize:11 }}>
      <div style={{ maxWidth:480, margin:'0 auto' }}>
        <div style={{ height:3, background:'repeating-linear-gradient(45deg,#ff2200 0px,#ff2200 4px,#1a0800 4px,#1a0800 8px)', marginBottom:20, opacity:.5 }} />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <div>
            <div style={{ color:'rgba(255,100,0,.4)', letterSpacing:3, marginBottom:8, fontSize:9 }}>SERWIS</div>
            {[['/', 'Strona Główna'],['piwo','🍺 Postaw Piwo'],['premium','⚡ Premium'],['o-nas','O Nas'],['blog','Blog']].map(([href, label])=>(
              <a key={href} href={`/${href}`} style={{ display:'block', color:'rgba(255,80,0,.4)', textDecoration:'none', marginBottom:4 }}>{label}</a>
            ))}
          </div>
          <div>
            <div style={{ color:'rgba(255,100,0,.4)', letterSpacing:3, marginBottom:8, fontSize:9 }}>LEGAL</div>
            {[['regulamin','Regulamin'],['polityka-prywatnosci','Polityka Prywatności'],['o-nas#kontakt','Kontakt']].map(([href, label])=>(
              <a key={href} href={`/${href}`} style={{ display:'block', color:'rgba(255,80,0,.4)', textDecoration:'none', marginBottom:4 }}>{label}</a>
            ))}
          </div>
        </div>
        <div style={{ borderTop:'1px solid rgba(255,40,0,.1)', paddingTop:14, textAlign:'center' }}>
          <p style={{ color:'rgba(255,60,0,.25)', margin:0, lineHeight:1.6 }}>
            ⚠️ Aplikacja satyryczna. Nie ponosimy odpowiedzialności za zniszczone telefony i relacje z szefem.
          </p>
          <p style={{ color:'rgba(255,40,0,.15)', margin:'8px 0 0', fontSize:10 }}>
            © {new Date().getFullYear()} Kurwomat.pl · Made with ❤️ i ☕ w łazience w Oświęcimiu · v3.0
          </p>
        </div>
      </div>
    </footer>
  );
}
