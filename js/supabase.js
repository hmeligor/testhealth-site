// ===== Підключення до Supabase =====

const SUPABASE_URL = 'https://pcxhqabkwxfvjywwglss.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7fWpSUB3KAEzBhVtPdMR4A_8-YcE-7t';

if (SUPABASE_URL.includes('ТВОЙ') || SUPABASE_ANON_KEY.includes('ТВІЙ')) {
  alert('У файлі js/supabase.js не вставлені ключі Supabase!');
}

// Створюємо клієнт, доступний скрізь
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
