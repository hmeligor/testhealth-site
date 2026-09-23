// ===== Модальні вікна =====
function openModal(id) {
  document.getElementById(id).classList.add('modal--open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('modal--open');
}
function switchModal(closeId, openId) {
  closeModal(closeId);
  openModal(openId);
}
// Закриття по кліку на темний фон
document.querySelectorAll('.modal').forEach(m => {
  m.addEventListener('click', e => {
    if (e.target === m) m.classList.remove('modal--open');
  });
});

// ===== Перевірка стану авторизації при завантаженні =====
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) showUserMenu(session.user);
  loadArticles();
});

// Слідкуємо за змінами авторизації (вхід/вихід у іншій вкладці)
supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (session) showUserMenu(session.user);
  else showGuestMenu();
});

// ===== Реєстрація =====
async function handleRegister(e) {
  e.preventDefault();
  const errEl = document.getElementById('regError');
  errEl.textContent = '';

  const profile = {
    nickname: document.getElementById('regNickname').value.trim(),
    gender: document.getElementById('regGender').value,
    birth_year: Number(document.getElementById('regBirthYear').value),
    role: document.getElementById('regRole').value,
  };

  const { data, error } = await supabaseClient.auth.signUp({
    email: document.getElementById('regEmail').value.trim(),
    password: document.getElementById('regPassword').value,
    options: { data: profile }, // метадані → тригер створить рядок у profiles
  });

  if (error) { errEl.textContent = error.message; return; }

  closeModal('registerModal');
  if (data.session) showUserMenu(data.user);
  else alert('Перевір email — ми надіслали посилання для підтвердження.');
}

// ===== Вхід =====
async function handleLogin(e) {
  e.preventDefault();
  const errEl = document.getElementById('loginError');
  errEl.textContent = '';

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: document.getElementById('loginEmail').value.trim(),
    password: document.getElementById('loginPassword').value,
  });

  if (error) { errEl.textContent = error.message; return; }
  closeModal('loginModal');
}

// ===== Вихід =====
async function logout() {
  await supabaseClient.auth.signOut();
}

// ===== Меню: гість / користувач =====
function showUserMenu(user) {
  document.getElementById('guestMenu').classList.add('nav--hidden');
  document.getElementById('userMenu').classList.remove('nav--hidden');
  const nick = user.user_metadata?.nickname || user.email;
  document.getElementById('helloUser').textContent = 'Привіт, ' + nick + '!';
}
function showGuestMenu() {
  document.getElementById('guestMenu').classList.remove('nav--hidden');
  document.getElementById('userMenu').classList.add('nav--hidden');
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

// ===== Допоміжні функції =====
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
