// ===== Модальне вікно =====
function openModal(id) {
  document.getElementById(id).classList.add('modal--open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('modal--open');
}
// Закриття по кліку на темний фон
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => {
    if (e.target === m) m.classList.remove('modal--open');
  });
});

// ===== Вкладки Вхід / Реєстрація =====
function showTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('formLogin').classList.toggle('form--hidden', !isLogin);
  document.getElementById('formRegister').classList.toggle('form--hidden', isLogin);
  document.getElementById('tabLogin').classList.toggle('tabs__btn--active', isLogin);
  document.getElementById('tabRegister').classList.toggle('tabs__btn--active', !isLogin);
}

// ===== Кнопка у шапці (для гостя) =====
function onAuthButton() {
  showTab('login');
  openModal('authModal');
}

// ===== Випадне меню користувача =====
function toggleUserMenu() {
  document.getElementById('userMenuDropdown').classList.toggle('user-menu__dropdown--open');
}
// Закриття меню при кліку поза ним
document.addEventListener('click', e => {
  const menu = document.getElementById('userMenu');
  if (menu && !menu.contains(e.target)) {
    document.getElementById('userMenuDropdown')?.classList.remove('user-menu__dropdown--open');
  }
});

// ===== Вихід =====
async function logout() {
  await supabaseClient.auth.signOut();
}

// ===== Видалення профілю =====
async function deleteProfile() {
  if (!confirm('Видалити профіль назавжди? Цю дію неможливо скасувати.')) return;
  const { error } = await supabaseClient.rpc('delete_own_account');
  if (error) { alert('Помилка: ' + error.message); return; }
  await supabaseClient.auth.signOut();
}

// ===== Стан авторизації =====
window.addEventListener('DOMContentLoaded', async () => {
  await updateAuthButton();
  loadArticles();
});

supabaseClient.auth.onAuthStateChange(() => {
  updateAuthButton();
});

async function updateAuthButton() {
  const btn = document.getElementById('authButton');
  const userMenu = document.getElementById('userMenu');
  const userMenuButton = document.getElementById('userMenuButton');
  const editorBtn = document.getElementById('editorButton');

  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session) {
    // Гість: кнопка «Вхід», меню користувача сховане
    btn.hidden = false;
    btn.textContent = 'Вхід';
    userMenu.hidden = true;
    editorBtn.classList.add('header__btn--hidden');
    return;
  }

  // Авторизований: ховаємо «Вхід», показуємо меню з нікнеймом
  btn.hidden = true;
  userMenu.hidden = false;

  // Нікнейм і роль беремо з бази (працює для всіх акаунтів, навіть старих)
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('nickname, role')
    .eq('id', session.user.id)
    .single();

  userMenuButton.textContent = profile?.nickname || session.user.email;

  // Кнопку редактора показуємо тільки спеціалістам
  editorBtn.classList.toggle('header__btn--hidden', profile?.role !== 'specialist');
}

// ===== Завантаження статей =====
async function loadArticles() {
  const grid = document.getElementById('articlesGrid');
  const { data: articles, error } = await supabaseClient
    .from('articles')
    .select('id, title, text, created_at, profiles(nickname)')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error || !articles || articles.length === 0) {
    grid.innerHTML = '<p class="articles__loading">Статей поки немає.</p>';
    return;
  }

  grid.innerHTML = articles.map(a => `
    <article class="article-card">
      <h3 class="article-card__title">${escapeHtml(a.title)}</h3>
      <p class="article-card__meta">
        ${escapeHtml(a.profiles?.nickname ?? 'Спеціаліст')} · ${formatDate(a.created_at)}
      </p>
      <p class="article-card__text">${escapeHtml(a.text.slice(0, 200))}${a.text.length > 200 ? '…' : ''}</p>
    </article>
  `).join('');
}

// ===== Допоміжні =====
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('uk-UA', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}
