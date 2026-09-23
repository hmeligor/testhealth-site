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

// ===== Кнопка у шапці =====
function onAuthButton() {
  const session = supabaseClient.auth.getSession();
  session.then(({ data }) => {
    if (data.session) {
      // Авторизований → виходимо
      supabaseClient.auth.signOut();
    } else {
      // Гість → відкриваємо модальне вікно
      showTab('login');
      openModal('authModal');
    }
  });
}

// ===== Стан авторизації =====
window.addEventListener('DOMContentLoaded', async () => {
  updateAuthButton();
  loadArticles();
});

supabaseClient.auth.onAuthStateChange(() => {
  updateAuthButton();
});

function updateAuthButton() {
  supabaseClient.auth.getSession().then(({ data }) => {
    const btn = document.getElementById('authButton');
    const editorBtn = document.getElementById('editorButton');
    if (data.session) {
      btn.textContent = 'Вийти';
      // Кнопку редактора показуємо тільки спеціалістам
      const role = data.session.user.user_metadata?.role;
      editorBtn.classList.toggle('header__btn--hidden', role !== 'specialist');
    } else {
      btn.textContent = 'Вхід';
      editorBtn.classList.add('header__btn--hidden');
    }
  });
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
  closeModal('authModal');
}

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
    options: { data: profile },
  });

  if (error) { errEl.textContent = error.message; return; }

  closeModal('authModal');
  if (data.session) {
    alert('Реєстрація успішна!');
  } else {
    alert('Перевір email — ми надіслали посилання для підтвердження.');
  }
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
