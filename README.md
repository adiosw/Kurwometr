# 💥 KURWOMAT v3 — Kompletny Pakiet
### Kuźnia Wkurwu Narodowego | Full Business Edition

---

## 🚀 KOLEJNOŚĆ WDROŻENIA

### KROK 1 — Supabase SQL
1. Wejdź na `supabase.com` → Twój projekt → SQL Editor
2. Wklej **całą zawartość** `sql/schema_v2.sql`
3. Kliknij **Run**
4. W **Database → Replication** włącz Realtime dla:
   - `global_stats`, `city_stats`, `donations`, `league_scores`, `early_bird_counter`

### KROK 2 — Stripe Dashboard

**Produkty do stworzenia:**

| Nazwa | Typ | Kwota |
|---|---|---|
| Premium Miesięczny | Recurring | 9.99 PLN |
| Premium Lifetime   | One-time  | 49.99 PLN |
| Donate (Piwomat)   | Dynamic   | N/A (dynamiczna) |

**Webhook:**
```
URL: https://TWOJA_DOMENA/api/stripe-webhook
Events: checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, payment_intent.payment_failed
```

Skopiuj `Webhook Secret` → do `.env.local` jako `STRIPE_WEBHOOK_SECRET`

### KROK 3 — Zmienne środowiskowe
```bash
cp .env.local.example .env.local
# Uzupełnij WSZYSTKIE wartości!
```

**Generowanie VAPID keys:**
```bash
npx web-push generate-vapid-keys
```

### KROK 4 — Instalacja
```bash
npm install
npm run dev     # lokalne testy
npm run build   # sprawdź czy buduje bez błędów
```

### KROK 5 — Deploy Vercel
```bash
vercel --prod
# lub push na GitHub + auto-deploy przez Vercel Dashboard
```

**W Vercel Dashboard → Settings → Environment Variables:**
Dodaj wszystkie zmienne z `.env.local.example`

---

## 📁 STRUKTURA PROJEKTU

```
kurwomat/
├── sql/
│   └── schema_v2.sql              # ← WKLEJ JAKO PIERWSZE
├── app/
│   ├── layout.tsx                 # SEO, GA4, CookieBanner, Footer
│   ├── page.tsx                   # Strona główna
│   ├── globals.css                # Design system + animacje
│   ├── robots.ts                  # robots.txt
│   ├── sitemap.ts                 # Dynamic sitemap.xml
│   ├── piwo/page.tsx              # Piwomat — donate page
│   ├── premium/page.tsx           # Cennik Premium + Early Bird
│   ├── o-nas/page.tsx             # Strona O Nas (exact text)
│   ├── regulamin/page.tsx         # /regulamin + /polityka-prywatnosci
│   └── api/
│       ├── donate/route.ts        # Stripe Checkout (jednorazowe)
│       ├── subscribe/route.ts     # Stripe Subscription
│       ├── stripe-webhook/route.ts # Webhook + Lucky Shot logic
│       ├── lucky-shot/check/route.ts # Sprawdź wygraną po redirect
│       ├── early-bird/route.ts    # GET counter + POST claim
│       └── og/route.tsx           # Dynamic OG images (Edge)
├── components/
│   ├── KurwomatApp.tsx            # Główna aplikacja (mikrofon, mapa, etc.)
│   ├── analytics/GoogleAnalytics.tsx
│   ├── donate/LuckyShotResult.tsx # 5 animacji wygranej Lucky Shot
│   ├── legal/CookieBanner.tsx     # RODO cookie banner
│   └── premium/
│       ├── EarlyBirdBanner.tsx    # Early Bird z live counterem
│       └── PremiumPricing.tsx     # Cennik
├── hooks/
│   ├── useGlobalStats.ts          # Realtime Supabase
│   ├── useGeolocation.ts          # GPS → miasto
│   └── usePushNotifications.ts    # Web Push subscribe
├── lib/
│   └── supabase.ts                # Client + Types
├── middleware.ts                  # Rate limiting (20 req/min/IP)
├── public/
│   ├── sw.js                      # Service Worker + 19:30 push
│   ├── manifest.json              # PWA manifest
│   └── icon.svg                   # App icon
├── next.config.js
├── vercel.json                    # Cron jobs
├── tsconfig.json
└── .env.local.example             # Template zmiennych
```

---

## 🎰 LUCKY SHOT — Jak Działa

1. User płaci kwotę np. **11.04 PLN** przez Stripe
2. Stripe webhook trafia na `/api/stripe-webhook`
3. Webhook wywołuje `check_and_rotate_lucky()` w Supabase
4. Funkcja SQL sprawdza czy kwota pasuje do tabeli `lucky_amounts`
5. Jeśli TAK → nadaje nagrodę + usuwa kwotę + losuje NOWĄ w tym samym tierze
6. Po powrocie ze Stripe → `/piwo?success=true&session_id=xxx`
7. Frontend odpytuje `/api/lucky-shot/check?session_id=xxx`
8. Jeśli wygrał → pokazuje 1 z 5 losowych animacji

**Specjalna kwota 11.04 PLN:** Jest zawsze regenerowana (Wielkanoc w każdy dzień).

---

## 💰 STRIPE — Konfiguracja Lokalnego Testowania

```bash
# Zainstaluj Stripe CLI
brew install stripe/stripe-cli/stripe

# Zaloguj się
stripe login

# Forward webhooks lokalnie
stripe listen --forward-to localhost:3000/api/stripe-webhook

# Skopiuj webhook secret z outputu do .env.local
```

---

## 📊 GOOGLE ANALYTICS 4

Dodaj ID do `.env.local`:
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

Custom events wysyłane automatycznie:
- `kurwa_click` — każde kliknięcie (button/mic)
- `begin_checkout` — start Stripe checkout
- `lucky_shot_win` — wygrana Lucky Shot

---

## 🔔 VERCEL CRON (wymaga Pro lub Business)

| Endpoint | Czas UTC | Czas PL |
|---|---|---|
| `/api/push-send` | 17:30 | 19:30 |
| `/api/leagues/reset-daily` | 22:00 | 00:00 |

Alternatywnie: **cron-job.org** (bezpłatny)

---

## 🛡️ SECURITY

- **Rate Limiting:** `middleware.ts` — 20 req/min/IP na `/api/voice`, `/api/share`, `/api/donate`
- **Anti-spam płatności:** Backend walidacja minimum 2.00 PLN
- **Stripe webhook:** Weryfikacja podpisu `stripe.webhooks.constructEvent()`
- **Row Level Security:** Wszystkie tabele Supabase mają RLS włączone
- **Service Key:** Nigdy nie idzie do klienta (`SUPABASE_SERVICE_KEY` bez `NEXT_PUBLIC_`)
- **Security Headers:** X-Frame-Options, X-XSS-Protection, Permissions-Policy

---

*💥 Zbudowane w łazience w Oświęcimiu · v3.0 · 2025*
