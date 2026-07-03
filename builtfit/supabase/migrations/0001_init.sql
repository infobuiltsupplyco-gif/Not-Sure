-- BuiltFit — initial schema
-- All user tables have RLS: users can only read/write their own rows.
-- foods_cache is globally readable; only the service role writes to it.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  dob date,
  sex text check (sex in ('male', 'female')),
  height_cm numeric(5, 1) check (height_cm between 90 and 260),
  weight_kg numeric(5, 1) check (weight_kg between 25 and 400),
  activity_level text not null default 'light'
    check (activity_level in ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  goal_type text not null default 'maintain'
    check (goal_type in ('lose', 'maintain', 'gain')),
  -- Conservative rates only: max 0.75 kg/week.
  goal_rate numeric(3, 2) not null default 0.25
    check (goal_rate in (0.25, 0.5, 0.75)),
  gentle_mode boolean not null default false,
  -- Wellbeing default: exercise calories are NOT added back to the budget.
  exercise_calories_back boolean not null default false,
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  timezone text not null default 'UTC',
  -- Hard safety floor: no adult calorie target below 1200 kcal/day, ever.
  calorie_target integer check (calorie_target >= 1200),
  protein_target_g integer check (protein_target_g between 30 and 400),
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: own read" on public.profiles
  for select using (auth.uid() = user_id);
create policy "profiles: own insert" on public.profiles
  for insert with check (auth.uid() = user_id);
create policy "profiles: own update" on public.profiles
  for update using (auth.uid() = user_id);
create policy "profiles: own delete" on public.profiles
  for delete using (auth.uid() = user_id);

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;
  insert into public.streaks (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- foods_cache — verified foods from USDA / Open Food Facts.
-- Global read; writes only via service role (no RLS insert policy for users).
-- ---------------------------------------------------------------------------
create table public.foods_cache (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('usda', 'off')),
  source_id text not null,
  name text not null,
  brand text,
  barcode text,
  servings jsonb not null default '[{"label": "100 g", "grams": 100}]',
  per_100g jsonb not null,
  verified boolean not null default true,
  confidence numeric(3, 2) not null default 0.8 check (confidence between 0 and 1),
  whole_food boolean not null default false,
  cached_at timestamptz not null default now(),
  unique (source, source_id)
);

create index foods_cache_name_idx on public.foods_cache using gin (to_tsvector('english', name));
create index foods_cache_name_trgm_idx on public.foods_cache (lower(name) text_pattern_ops);
create index foods_cache_barcode_idx on public.foods_cache (barcode) where barcode is not null;

alter table public.foods_cache enable row level security;

create policy "foods_cache: global read" on public.foods_cache
  for select using (true);
-- No insert/update/delete policies: only the service role (bypasses RLS) writes.

-- ---------------------------------------------------------------------------
-- personal_foods — user-created foods. Private, always marked unverified,
-- never surfaced in global search.
-- ---------------------------------------------------------------------------
create table public.personal_foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  brand text,
  per_100g jsonb not null,
  servings jsonb not null default '[{"label": "100 g", "grams": 100}]',
  created_at timestamptz not null default now()
);

create index personal_foods_user_idx on public.personal_foods (user_id);

alter table public.personal_foods enable row level security;
create policy "personal_foods: own all" on public.personal_foods
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- recipes + ingredients — per-serving nutrition auto-computed in app code and
-- stored on the recipe row.
-- ---------------------------------------------------------------------------
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  servings_count numeric(5, 1) not null default 1 check (servings_count > 0),
  per_serving jsonb not null,
  serving_grams numeric(7, 1) not null default 100,
  created_at timestamptz not null default now()
);

create index recipes_user_idx on public.recipes (user_id);

alter table public.recipes enable row level security;
create policy "recipes: own all" on public.recipes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  food_id text not null,
  food_name text not null,
  quantity numeric(7, 2) not null check (quantity > 0),
  serving_label text not null,
  serving_grams numeric(7, 1) not null,
  nutrition jsonb not null
);

create index recipe_ingredients_recipe_idx on public.recipe_ingredients (recipe_id);

alter table public.recipe_ingredients enable row level security;
create policy "recipe_ingredients: own all" on public.recipe_ingredients
  for all using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- diary_entries — nutrition snapshot stored as jsonb so history never changes
-- if food data updates later.
-- ---------------------------------------------------------------------------
create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_id text not null,
  food_name text not null,
  food_brand text,
  verified boolean not null default false,
  quantity numeric(7, 2) not null check (quantity > 0),
  serving_label text not null,
  serving_grams numeric(7, 1) not null,
  nutrition jsonb not null,
  whole_food boolean not null default false,
  created_at timestamptz not null default now()
);

create index diary_entries_user_date_idx on public.diary_entries (user_id, date);

alter table public.diary_entries enable row level security;
create policy "diary_entries: own all" on public.diary_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- exercise_entries — burn stored as a range; the LOW end is used in budgets.
-- ---------------------------------------------------------------------------
create table public.exercise_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  activity text not null,
  met_value numeric(4, 1) not null check (met_value between 1 and 25),
  duration_min integer not null check (duration_min between 1 and 1440),
  computed_burn_low integer not null,
  computed_burn_high integer not null,
  created_at timestamptz not null default now()
);

create index exercise_entries_user_date_idx on public.exercise_entries (user_id, date);

alter table public.exercise_entries enable row level security;
create policy "exercise_entries: own all" on public.exercise_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- weight_logs / measurement_logs / water_logs
-- ---------------------------------------------------------------------------
create table public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  weight_kg numeric(5, 1) not null check (weight_kg between 25 and 400),
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create index weight_logs_user_date_idx on public.weight_logs (user_id, date);

alter table public.weight_logs enable row level security;
create policy "weight_logs: own all" on public.weight_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.measurement_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  site text not null check (site in ('waist', 'hips', 'chest', 'left_arm', 'right_arm', 'left_thigh', 'right_thigh', 'neck')),
  value_cm numeric(5, 1) not null check (value_cm between 10 and 300),
  created_at timestamptz not null default now()
);

create index measurement_logs_user_date_idx on public.measurement_logs (user_id, date);

alter table public.measurement_logs enable row level security;
create policy "measurement_logs: own all" on public.measurement_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  ml integer not null check (ml between 1 and 10000),
  created_at timestamptz not null default now()
);

create index water_logs_user_date_idx on public.water_logs (user_id, date);

alter table public.water_logs enable row level security;
create policy "water_logs: own all" on public.water_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- progress_photos — files live in a private storage bucket.
-- ---------------------------------------------------------------------------
create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  storage_path text not null,
  note text,
  created_at timestamptz not null default now()
);

create index progress_photos_user_date_idx on public.progress_photos (user_id, date);

alter table public.progress_photos enable row level security;
create policy "progress_photos: own all" on public.progress_photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Private storage bucket for progress photos.
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

create policy "progress photos: own read" on storage.objects
  for select using (
    bucket_id = 'progress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "progress photos: own insert" on storage.objects
  for insert with check (
    bucket_id = 'progress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
create policy "progress photos: own delete" on storage.objects
  for delete using (
    bucket_id = 'progress-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------------
-- streaks — based on logging consistency, never calorie compliance.
-- ---------------------------------------------------------------------------
create table public.streaks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_logged_date date
);

alter table public.streaks enable row level security;
create policy "streaks: own all" on public.streaks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bump the logging streak whenever a diary entry is created. Purely
-- consistency-based: what you logged is irrelevant, only that you logged.
create or replace function public.bump_streak()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  s public.streaks%rowtype;
begin
  select * into s from public.streaks where user_id = new.user_id for update;
  if not found then
    insert into public.streaks (user_id, current_streak, longest_streak, last_logged_date)
    values (new.user_id, 1, 1, new.date);
    return new;
  end if;

  if s.last_logged_date is null or new.date > s.last_logged_date then
    if s.last_logged_date = new.date - 1 then
      s.current_streak := s.current_streak + 1;
    else
      s.current_streak := 1;
    end if;
    update public.streaks
    set current_streak = s.current_streak,
        longest_streak = greatest(longest_streak, s.current_streak),
        last_logged_date = new.date
    where user_id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger diary_entry_streak
  after insert on public.diary_entries
  for each row execute function public.bump_streak();

-- ---------------------------------------------------------------------------
-- food_quality_scores — daily computed snapshot.
-- ---------------------------------------------------------------------------
create table public.food_quality_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  whole_food_pct numeric(5, 1) not null default 0,
  protein_adequacy numeric(5, 1) not null default 0,
  fiber_g numeric(6, 1) not null default 0,
  micro_coverage_pct numeric(5, 1) not null default 0,
  overall numeric(5, 1) not null default 0,
  unique (user_id, date)
);

create index food_quality_scores_user_date_idx on public.food_quality_scores (user_id, date);

alter table public.food_quality_scores enable row level security;
create policy "food_quality_scores: own all" on public.food_quality_scores
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- The auth.users trigger must be created after the tables it touches.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
