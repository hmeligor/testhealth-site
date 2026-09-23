-- =============================================
-- Схема бази даних МедПлатформи (Supabase SQL Editor)
-- Виконай цей файл одночасно: кнопка "Run"
-- =============================================

-- 1. Профілі користувачів
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  nickname    text not null,
  gender      text not null check (gender in ('female', 'male', 'other')),
  birth_year  int  not null check (birth_year between 1920 and 2026),
  role        text not null check (role in ('user', 'specialist')),
  created_at  timestamptz default now()
);

-- Автоматичне створення профілю при реєстрації
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, gender, birth_year, role)
  values (
    new.id,
    new.raw_user_meta_data->>'nickname',
    new.raw_user_meta_data->>'gender',
    (new.raw_user_meta_data->>'birth_year')::int,
    new.raw_user_meta_data->>'role'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. Статті
create table articles (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references profiles(id) on delete cascade,
  title       text not null,
  text        text not null,
  status      text not null default 'draft' check (status in ('draft', 'published')),
  created_at  timestamptz default now()
);

-- 3. Row Level Security (обов'язково для безпеки!)
alter table profiles enable row level security;
alter table articles enable row level security;

-- Профілі: читати можуть усі авторизовані, редагувати — тільки власник
create policy "profiles readable" on profiles
  for select using (auth.role() = 'authenticated');
create policy "own profile editable" on profiles
  for update using (auth.uid() = id);

-- Статті: читати опубліковані можуть усі (включаючи гостей),
-- створювати — лише спеціалісти, редагувати — лише автор
create policy "published articles readable" on articles
  for select using (status = 'published' or auth.uid() = author_id);
create policy "specialists can write" on articles
  for insert with check (
    auth.uid() = author_id
    and exists (select 1 from profiles where id = auth.uid() and role = 'specialist')
  );
create policy "author can edit" on articles
  for update using (auth.uid() = author_id);

-- 4. Тестова стаття (для перевірки головної сторінки)
-- Її має опублікувати спеціаліст через базу, або через майбутню сторінку редактора.
