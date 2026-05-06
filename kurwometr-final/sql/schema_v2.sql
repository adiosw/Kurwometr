-- ============================================================
-- KURWOMAT — schema_v2.sql
-- Wklej CAŁOŚĆ do Supabase SQL Editor i uruchom
-- ============================================================

-- ─────────────────────────────────────────────
-- 0. ROZSZERZ profiles (jeśli istnieje z v1)
-- ─────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  username        text unique,
  display_name    text,
  tier            smallint not null default 0,
  tier_expires_at timestamptz,
  is_donor        boolean not null default false,
  total_donated   numeric(10,2) not null default 0,
  mic_uses_today  integer not null default 0,
  mic_reset_date  date,
  created_at      timestamptz default now()
);

alter table public.profiles
  add column if not exists username        text unique,
  add column if not exists display_name    text,
  add column if not exists tier            smallint not null default 0,
  add column if not exists tier_expires_at timestamptz,
  add column if not exists is_donor        boolean not null default false,
  add column if not exists total_donated   numeric(10,2) not null default 0,
  add column if not exists mic_uses_today  integer not null default 0,
  add column if not exists mic_reset_date  date;

alter table public.profiles enable row level security;
create policy if not exists "Własny profil" on public.profiles
  for all using (auth.uid() = id);
create policy if not exists "Odczyt publiczny" on public.profiles
  for select using (true);

-- Tier helper
create or replace function public.get_mic_limit(p_tier smallint)
returns integer language plpgsql as $$
begin
  return case p_tier
    when 0 then 10
    when 1 then 50
    when 2 then -1
    when 3 then -1
    else 10
  end;
end;
$$;

-- ─────────────────────────────────────────────
-- 1. GLOBAL STATS (singleton)
-- ─────────────────────────────────────────────
create table if not exists public.global_stats (
  id            integer primary key default 1 check (id = 1),
  total_clicks  bigint not null default 2137420,
  last_updated  timestamptz default now()
);
insert into public.global_stats (id, total_clicks) values (1, 2137420)
  on conflict (id) do nothing;

alter table public.global_stats enable row level security;
create policy if not exists "Odczyt global_stats" on public.global_stats for select using (true);
create policy if not exists "Update global_stats"  on public.global_stats for update using (true);

create or replace function public.increment_global_clicks(delta integer default 1)
returns bigint language plpgsql as $$
declare v_total bigint;
begin
  update public.global_stats
  set total_clicks = total_clicks + delta, last_updated = now()
  where id = 1 returning total_clicks into v_total;
  return v_total;
end;
$$;

-- ─────────────────────────────────────────────
-- 2. RECEIPTS (każde kliknięcie)
-- ─────────────────────────────────────────────
create table if not exists public.receipts (
  id         bigserial primary key,
  user_id    uuid references auth.users(id) on delete set null,
  amount     integer not null default 1,
  city       text,
  lat        double precision,
  lng        double precision,
  context    text check (context in ('PRACA','DOM')),
  reason     text,
  created_at timestamptz default now()
);
alter table public.receipts enable row level security;
create policy if not exists "Insert receipt" on public.receipts for insert with check (true);
create policy if not exists "Odczyt własnych" on public.receipts for select using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 3. CITY STATS
-- ─────────────────────────────────────────────
create table if not exists public.city_stats (
  city   text primary key,
  clicks bigint not null default 0,
  lat    double precision,
  lng    double precision
);
alter table public.city_stats enable row level security;
create policy if not exists "Odczyt city_stats" on public.city_stats for select using (true);
create policy if not exists "Zapis city_stats"  on public.city_stats for all using (true);

insert into public.city_stats (city, clicks, lat, lng) values
  ('Warszawa',87420,52.2297,21.0122),('Kraków',54210,50.0647,19.9450),
  ('Gdańsk',31840,54.3520,18.6466),('Wrocław',42100,51.1079,17.0385),
  ('Poznań',28900,52.4064,16.9252),('Łódź',35200,51.7592,19.4560),
  ('Katowice',29800,50.2649,19.0238),('Szczecin',18400,53.4285,14.5528),
  ('Lublin',21300,51.2465,22.5684),('Rzeszów',15600,50.0412,21.9991),
  ('Bydgoszcz',17800,53.1235,18.0084),('Białystok',14200,53.1325,23.1688),
  ('Oświęcim',2137,50.0342,19.2108)
on conflict (city) do nothing;

-- ─────────────────────────────────────────────
-- 4. DONATIONS (Piwomat)
-- ─────────────────────────────────────────────
create table if not exists public.donations (
  id                bigserial primary key,
  user_id           uuid references auth.users(id) on delete set null,
  stripe_session_id text unique,
  stripe_payment_id text,
  amount            numeric(10,2) not null check (amount >= 2.00),
  currency          text not null default 'pln',
  beer_type         text,
  beer_custom_name  text,     -- własna nazwa piwa wpisana przez usera
  message           text,
  display_name      text,
  is_anonymous      boolean not null default false,
  status            text not null default 'pending' check (status in ('pending','completed','refunded')),
  lucky_shot_won    boolean not null default false,
  lucky_tier        smallint,  -- 1 or 2
  created_at        timestamptz default now()
);
alter table public.donations enable row level security;
create policy if not exists "Odczyt donacji"  on public.donations for select using (true);
create policy if not exists "Insert donacji"  on public.donations for insert with check (true);
create policy if not exists "Update donacji"  on public.donations for update using (true);

-- Views
create or replace view public.donation_stats as
select
  count(*) filter (where status='completed') as total_beers,
  coalesce(sum(amount) filter (where status='completed'),0) as total_pln,
  count(distinct user_id) filter (where status='completed') as unique_donors;

create or replace view public.recent_donations as
select
  d.id,
  case when d.is_anonymous then 'Anonim 🎭' else coalesce(d.display_name,'Gość') end as donor_name,
  d.amount, d.beer_type, d.beer_custom_name, d.message, d.created_at,
  d.lucky_shot_won, d.lucky_tier,
  p.tier as donor_tier
from public.donations d
left join public.profiles p on p.id = d.user_id
where d.status = 'completed'
order by d.created_at desc limit 10;

create or replace view public.hall_of_fame as
select
  case when d.is_anonymous then 'Anonim 🎭' else coalesce(d.display_name,'Gość') end as donor_name,
  sum(d.amount) as total_amount,
  count(*) as beer_count,
  max(p.tier) as tier
from public.donations d
left join public.profiles p on p.id = d.user_id
where d.status = 'completed'
group by donor_name, d.is_anonymous, d.display_name
order by total_amount desc limit 3;

-- ─────────────────────────────────────────────
-- 5. LUCKY SHOT (hazardowy system kwot)
-- ─────────────────────────────────────────────
create table if not exists public.lucky_amounts (
  id          bigserial primary key,
  amount      numeric(10,2) unique not null,
  tier        smallint not null check (tier in (1,2)),
  is_active   boolean not null default true,
  created_at  timestamptz default now()
);
alter table public.lucky_amounts enable row level security;
-- Odczyt publiczny wyłączony celowo – serwer sprawdza przez service key
create policy if not exists "Service insert lucky" on public.lucky_amounts for all using (false);

-- Seed initial lucky amounts
-- TIER 1 (2.00 - 500.00): 15 kwot, ZAWSZE zawiera 11.04
insert into public.lucky_amounts (amount, tier) values
  (11.04,1),(21.37,1),(33.33,1),(42.00,1),(50.50,1),
  (69.00,1),(77.77,1),(88.88,1),(100.00,1),(123.45,1),
  (200.00,1),(250.00,1),(300.00,1),(420.00,1),(499.99,1),
  -- TIER 2 (500.01 - 1000.00): 5 kwot
  (500.01,2),(666.66,2),(777.00,2),(900.00,2),(1000.00,2)
on conflict (amount) do nothing;

-- Function: check lucky shot + rotate
create or replace function public.check_and_rotate_lucky(
  p_amount    numeric,
  p_user_id   uuid,
  p_donation_id bigint
) returns jsonb language plpgsql security definer as $$
declare
  v_lucky record;
  v_new_amount numeric;
  v_min_range numeric;
  v_max_range numeric;
  v_attempts int := 0;
begin
  -- Check if amount matches any active lucky amount (exact to 2 decimal places)
  select * into v_lucky
  from public.lucky_amounts
  where amount = round(p_amount::numeric, 2) and is_active = true
  limit 1;

  if not found then
    return jsonb_build_object('won', false);
  end if;

  -- Grant reward based on tier
  if v_lucky.tier = 1 then
    -- LEGEND 30 dni
    update public.profiles
    set tier = greatest(tier, 2),
        tier_expires_at = greatest(coalesce(tier_expires_at, now()), now()) + interval '30 days'
    where id = p_user_id;
  elsif v_lucky.tier = 2 then
    -- LIFETIME LEGEND
    update public.profiles
    set tier = greatest(tier, 2),
        tier_expires_at = null -- null = lifetime
    where id = p_user_id;
  end if;

  -- Mark donation as winner
  update public.donations
  set lucky_shot_won = true, lucky_tier = v_lucky.tier
  where id = p_donation_id;

  -- Delete won amount
  delete from public.lucky_amounts where id = v_lucky.id;

  -- Generate new unique amount in same tier range
  if v_lucky.tier = 1 then
    v_min_range := 2.00; v_max_range := 500.00;
  else
    v_min_range := 500.01; v_max_range := 1000.00;
  end if;

  -- Never regenerate 11.04 (special Easter egg – always stays in tier 1 if absent)
  loop
    v_new_amount := round((v_min_range + random() * (v_max_range - v_min_range))::numeric, 2);
    -- Skip 11.04 in rotation (it's manually managed)
    exit when v_new_amount <> 11.04;
    v_attempts := v_attempts + 1;
    exit when v_attempts > 10;
  end loop;

  -- Insert new lucky amount (ignore if collision)
  insert into public.lucky_amounts (amount, tier)
  values (v_new_amount, v_lucky.tier)
  on conflict (amount) do nothing;

  -- Re-add 11.04 if it was just won and is now missing from tier 1
  if v_lucky.amount = 11.04 then
    insert into public.lucky_amounts (amount, tier)
    values (11.04, 1)
    on conflict (amount) do nothing;
  end if;

  return jsonb_build_object(
    'won', true,
    'tier', v_lucky.tier,
    'amount', v_lucky.amount
  );
end;
$$;

-- ─────────────────────────────────────────────
-- 6. EARLY BIRDS (pierwsze 100 kont)
-- ─────────────────────────────────────────────
create table if not exists public.early_bird_counter (
  id        integer primary key default 1 check (id = 1),
  claimed   integer not null default 0,
  max_slots integer not null default 100
);
insert into public.early_bird_counter (id,claimed,max_slots) values (1,0,100)
  on conflict (id) do nothing;

create table if not exists public.early_birds (
  id          bigserial primary key,
  user_id     uuid references auth.users(id) on delete cascade unique not null,
  position    integer not null,
  granted_at  timestamptz default now(),
  expires_at  timestamptz default (now() + interval '30 days')
);
alter table public.early_birds enable row level security;
create policy if not exists "Odczyt early_birds" on public.early_birds for select using (true);

-- ATOMIC claim (race-condition safe)
create or replace function public.claim_early_bird(p_user_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  v_claimed integer;
begin
  if exists (select 1 from public.early_birds where user_id = p_user_id) then
    return jsonb_build_object('status','already_claimed');
  end if;

  update public.early_bird_counter
  set claimed = claimed + 1
  where id = 1 and claimed < max_slots
  returning claimed into v_claimed;

  if v_claimed is null then
    return jsonb_build_object('status','full');
  end if;

  insert into public.early_birds (user_id, position) values (p_user_id, v_claimed);

  update public.profiles
  set tier = greatest(tier,2),
      tier_expires_at = greatest(coalesce(tier_expires_at,now()), now()) + interval '30 days'
  where id = p_user_id;

  return jsonb_build_object('status','granted','position',v_claimed);
end;
$$;

-- ─────────────────────────────────────────────
-- 7. SUBSCRIPTIONS
-- ─────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                   bigserial primary key,
  user_id              uuid references auth.users(id) on delete cascade unique not null,
  stripe_customer_id   text,
  stripe_sub_id        text unique,
  plan                 text not null check (plan in ('monthly','lifetime')),
  status               text not null default 'active',
  current_period_end   timestamptz,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);
alter table public.subscriptions enable row level security;
create policy if not exists "Własna sub" on public.subscriptions for all using (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- 8. LIGI
-- ─────────────────────────────────────────────
create table if not exists public.leagues (
  id          bigserial primary key,
  slug        text unique not null,
  name        text not null,
  owner_id    uuid references auth.users(id) on delete cascade not null,
  invite_code text unique not null,
  is_public   boolean not null default false,
  created_at  timestamptz default now()
);
alter table public.leagues enable row level security;
create policy if not exists "Odczyt lig"    on public.leagues for select using (true);
create policy if not exists "Tworzenie ligi" on public.leagues for insert with check (auth.uid() = owner_id);

create table if not exists public.league_members (
  id          bigserial primary key,
  league_id   bigint references public.leagues(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  joined_at   timestamptz default now(),
  unique (league_id, user_id)
);
alter table public.league_members enable row level security;
create policy if not exists "Odczyt czlonkow" on public.league_members for select using (true);
create policy if not exists "Dolacz"          on public.league_members for insert with check (auth.uid() = user_id);

create table if not exists public.league_scores (
  id          bigserial primary key,
  league_id   bigint references public.leagues(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  score_date  date not null default current_date,
  daily_count integer not null default 0,
  total_count integer not null default 0,
  unique (league_id, user_id, score_date)
);
alter table public.league_scores enable row level security;
create policy if not exists "Odczyt scores" on public.league_scores for select using (true);
create policy if not exists "Update scores"  on public.league_scores for all using (auth.uid() = user_id);

-- Leaderboard function
create or replace function public.get_league_leaderboard(p_league_id bigint, p_limit integer default 20)
returns table(rank bigint, user_id uuid, display_name text, username text, tier smallint, is_donor boolean, today_count integer, total_count integer)
language sql as $$
  select
    row_number() over (order by coalesce(ls.daily_count,0) desc) as rank,
    p.id, coalesce(p.display_name,p.username,'Anonim'), p.username,
    p.tier, p.is_donor,
    coalesce(ls.daily_count,0), coalesce(ls.total_count,0)
  from public.league_members lm
  join public.profiles p on p.id = lm.user_id
  left join public.league_scores ls on ls.league_id=lm.league_id and ls.user_id=lm.user_id and ls.score_date=current_date
  where lm.league_id = p_league_id
  order by today_count desc
  limit p_limit;
$$;

-- ─────────────────────────────────────────────
-- 9. BLOG POSTS
-- ─────────────────────────────────────────────
create table if not exists public.posts (
  id           bigserial primary key,
  slug         text unique not null,
  title        text not null,
  excerpt      text,
  content      text not null,
  author       text not null default 'Instytut Wkurwu Narodowego',
  tags         text[],
  read_time    integer default 5,
  published    boolean not null default false,
  published_at timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);
alter table public.posts enable row level security;
create policy if not exists "Odczyt postow" on public.posts for select using (published=true);

-- SEO Blog post
insert into public.posts (slug,title,excerpt,content,tags,read_time,published,published_at) values
(
  'top-10-polskich-przeklen',
  'Top 10 najpopularniejszych polskich przekleństw – dlaczego "Kurwa" to słowo-klucz?',
  'Nauka odpowiada na pytanie, które każdy Polak zadaje sobie codziennie: dlaczego kląć jest tak dobrze? Dane z Kurwomatu ujawniają prawdę.',
  E'## Wstęp: Polska – kraj o bogatej kulturze językowej\n\nJęzyk polski jest uznawany za jeden z najtrudniejszych na świecie, ale ma jedną cechę, którą doceniają wszyscy: **bogactwo ekspresji emocjonalnej**. W żadnym innym języku jedno słowo nie może pełnić funkcji rzeczownika, czasownika, przysłówka i wykrzyknika jednocześnie. Mowa oczywiście o słowie, które legło u podstaw Kurwomatu.\n\n## 1. Kurwa (91% wszystkich przekleństw w Kurwometrze)\n\nKrólowa polszczyzny. Słowo-kombajn. Według danych zebranych przez **Instytut Wkurwu Narodowego**, "kurwa" stanowi 91,3% wszystkich zarejestrowanych przekleństw w naszej bazie. Badania lingwistyczne potwierdzają, że słowo to może wyrażać:\n\n- **Ból** ("Kurwa, uderzyłem się w mały palec")\n- **Zachwyt** ("Kurwa, ale widok!")\n- **Frustrację** ("Kurwa, znowu korki")\n- **Zaskoczenie** ("Kurwa, że co?!")\n- **Aprobatę** ("Kurwa, dobra robota")\n\nBadania Keele University wykazały, że wypowiadanie przekleństw zwiększa tolerancję bólu o **33%**. Polska przoduje w implementacji tej strategii.\n\n## 2. Pierdolić / Pierdol się (variacje: 6.2%)\n\nDrugi w hierarchii. Niezwykle wszechstronny czasownik z bogatą rodziną morfologiczną. Może oznaczać zarówno odejście ("pierdol się"), jak i szczyt pochwały ("napierdolił tę robotę"). Polszczyzna jest piękna.\n\n## 3. Chuj (3.1%)\n\nKlasyk. Według etymologów słowo o prasłowiańskich korzeniach. Używane zarówno w kontekście anatomicznym, jak i metaforycznym ("na chuja mi to"). Niezastąpiony.\n\n## 4. Jebać (warianty: 2.8%)\n\nCzasownik o niezliczonych zastosowaniach. Szczególnie popularny w regionach przemysłowych i podczas meczu reprezentacji Polski.\n\n## 5. Skurwysyn (1.9%)\n\nZłożenie funkcjonalne. Szczególnie popularne w godzinach szczytu komunikacyjnego (Korki – powód #1 w Kurwometrze).\n\n## 6. Kurwa Mać (1.4%)\n\nFormalna wersja dla osób ceniących tradycję. Szczyt ekspresji generacyjnej. Babcia używa, prawnuk używa.\n\n## 7. Spierdalaj (0.9%)\n\nDyrektywa. Jasna, precyzyjna, niemyląca. Polskie inżynieria językowa w najczystszej postaci.\n\n## 8. Cholera (0.7%)\n\nDla tych, którzy klinają z klasą. Często mylnie uważane za "słabe" przekleństwo, ale wypowiedziane z odpowiednią ekspresją może zatrzasnąć okno.\n\n## 9. Szlag (0.5%)\n\n"Niech go szlag trafi" – przekleństwo z tradycją sięgającą XVII wieku. Powraca do łask w erze hipsterów.\n\n## 10. Psiakrew (0.3%)\n\nRetro. Vintage. Dla dziadków, którzy nie chcą szokować wnuków, ale i tak chcą dać wyraz frustracji.\n\n## Dlaczego kląć jest zdrowe? Nauka mówi: TAK\n\nBadania z **Journal of Pain** (2009) wykazały, że przeklinanie aktywuje limbiczny układ nerwowy i zwiększa tolerancję bólu. Późniejsze badania Stephena Fry''a i Timothy Jaya potwierdziły, że regularne "wentylowanie emocji" poprzez przekleństwa:\n\n- Redukuje stres fizyczny (obniża kortyzol)\n- Buduje więzi społeczne (wspólne klącie = zaufanie)\n- Zwiększa autentyczność komunikacji\n\n**Kurwomat jest więc nie aplikacją, a narzędziem terapeutycznym.** Dyplom z Oświęcimia.\n\n## Dane z Kurwomatu: Kiedy Polska klnie najgłośniej?\n\nAnaliza 2 137 420+ kliknięć ujawnia wyraźne wzorce:\n\n- **07:45-08:30** – poranny szczyt (korki, spóźnienia)\n- **12:00-12:15** – "mała przerwa na wkurw" (szef, lunch, faktury)\n- **17:00-18:30** – wieczorny armagedon (korki, power hour)\n- **22:00-23:00** – refleksja dnia (rachunek sumienia i przekleństw)\n\n## Podsumowanie\n\nJęzyk jest lustrem kultury. Polska kląć umie – i to ze smakiem, precyzją i humorem. Kurwomat nie ocenia. Kurwomat zlicza. I cieszy się, że jesteś.\n\n**Sprawdź swój poziom frustracji na kurwometr.pl** 💥\n\n---\n*Dane oparte na anonimowych statystykach z Kurwomatu. Badanie satyryczne, ale dane prawdziwe.*',
  array['przekleństwa','polska','lingwistyka','humor','kurwa'],
  8, true, now() - interval '1 day'
) on conflict (slug) do nothing;

-- ─────────────────────────────────────────────
-- 10. RATE LIMIT LOG (opcjonalne – do monitoringu)
-- ─────────────────────────────────────────────
create table if not exists public.rate_limit_log (
  id         bigserial primary key,
  ip_hash    text not null,
  path       text not null,
  created_at timestamptz default now()
);
create index if not exists idx_rate_limit_log on public.rate_limit_log (ip_hash, path, created_at);

-- ─────────────────────────────────────────────
-- 11. PUSH SUBSCRIPTIONS
-- ─────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  id         bigserial primary key,
  endpoint   text unique not null,
  p256dh     text,
  auth_key   text,
  created_at timestamptz default now()
);
alter table public.push_subscriptions enable row level security;
create policy if not exists "Insert push" on public.push_subscriptions for insert with check (true);

-- ─────────────────────────────────────────────
-- 12. REALTIME — włącz dla kluczowych tabel
-- ─────────────────────────────────────────────
alter publication supabase_realtime add table public.global_stats;
alter publication supabase_realtime add table public.city_stats;
alter publication supabase_realtime add table public.donations;
alter publication supabase_realtime add table public.league_scores;
alter publication supabase_realtime add table public.early_bird_counter;

-- ─────────────────────────────────────────────
-- 13. INDEXES
-- ─────────────────────────────────────────────
create index if not exists idx_donations_status  on public.donations(status);
create index if not exists idx_donations_created on public.donations(created_at desc);
create index if not exists idx_lucky_active      on public.lucky_amounts(is_active, tier);
create index if not exists idx_posts_published   on public.posts(published_at desc) where published=true;
create index if not exists idx_profiles_tier     on public.profiles(tier);
create index if not exists idx_league_scores_date on public.league_scores(league_id, score_date desc);
create index if not exists idx_receipts_user     on public.receipts(user_id, created_at desc);

-- ─────────────────────────────────────────────
-- 14. HELPER FUNCTIONS
-- ─────────────────────────────────────────────
create or replace function public.update_donor_status(p_user_id uuid, p_amount numeric)
returns void language plpgsql security definer as $$
begin
  update public.profiles
  set is_donor = true,
      total_donated = total_donated + p_amount,
      tier = greatest(tier, 3),
      tier_expires_at = null
  where id = p_user_id;
end;
$$;

create or replace function public.generate_slug(len integer default 8)
returns text language sql as $$
  select string_agg(substr('abcdefghijklmnopqrstuvwxyz0123456789',ceil(random()*36)::integer,1),'')
  from generate_series(1,len);
$$;
