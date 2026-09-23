// ===== Підключення до Supabase =====
// ЗАМІНИ ці два значення на свої (Supabase Dashboard → Settings → API)

const SUPABASE_URL = 'https://ТВОЙ-ПРОЕКТ.supabase.co';
const SUPABASE_ANON_KEY = 'ТВІЙ-ANON-KEY';

// Створюємо клієнт, доступний скрізь
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
