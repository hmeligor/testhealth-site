// ===== Редактор статей (лише для спеціалістів) =====

let currentUser = null;

// Перевіряємо, що користувач — спеціаліст, інакше повертаємо на головну
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();

  if (!session || session.user.user_metadata?.role !== 'specialist') {
    window.location.href = 'index.html';
    return;
  }

  currentUser = session.user;
  loadMyArticles();
});

async function logout() {
  await supabaseClient.auth.signOut();
  window.location.href = 'index.html';
}

// ===== Зберегти / опублікувати (нова стаття або оновлення існуючої) =====
async function handleSaveArticle(e) {
  e.preventDefault();
  const errEl = document.getElementById('articleError');
  errEl.textContent = '';

  const id = document.getElementById('articleId').value;
  const title = document.getElementById('articleTitle').value.trim();
  const text = document.getElementById('articleText').value.trim();
  // Статус за кнопкою, яку натиснули
  const status = e.submitter?.value === 'published' ? 'published' : 'draft';

  let error;
  if (id) {
    // Оновлення існуючої статті
    ({ error } = await supabaseClient
      .from('articles')
      .update({ title, text, status })
      .eq('id', id));
  } else {
    // Нова стаття
    ({ error } = await supabaseClient
      .from('articles')
      .insert({ author_id: currentUser.id, title, text, status }));
  }

  if (error) { errEl.textContent = error.message; return; }

  resetForm();
  loadMyArticles();
}

// ===== Редагування: підвантажуємо статтю у форму =====
async function editArticle(id) {
  const { data: article, error } = await supabaseClient
    .from('articles')
    .select('id, title, text')
    .eq('id', id)
    .single();

  if (error) return;

  document.getElementById('articleId').value = article.id;
  document.getElementById('articleTitle').value = article.title;
  document.getElementById('articleText').value = article.text;
  document.getElementById('formTitle').textContent = 'Редагування статті';
  document.getElementById('cancelEditBtn').hidden = false;
  document.getElementById('articleError').textContent = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== Повертаємо форму в режим «Нова стаття» =====
function resetForm() {
  document.getElementById('articleId').value = '';
  document.getElementById('articleTitle').value = '';
  document.getElementById('articleText').value = '';
  document.getElementById('formTitle').textContent = 'Нова стаття';
  document.getElementById('cancelEditBtn').hidden = true;
  document.getElementById('articleError').textContent = '';
}

// ===== Мої статті =====
async function loadMyArticles() {
  const box = document.getElementById('myArticles');
  const { data: articles, error } = await supabaseClient
    .from('articles')
    .select('id, title, text, status, created_at')
    .eq('author_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error || !articles || articles.length === 0) {
    box.innerHTML = '<p class="articles__loading">У вас поки немає статей.</p>';
    return;
  }

  box.innerHTML = articles.map(a => `
    <div class="my-article">
      <div class="my-article__info">
        <h3>${escapeHtml(a.title)}</h3>
        <p class="my-article__meta">${formatDate(a.created_at)}</p>
      </div>
      <span class="badge badge--${a.status}">${a.status === 'published' ? 'Опубліковано' : 'Черновик'}</span>
      <div class="my-article__actions">
        <button class="btn btn--small btn--outline" onclick="editArticle('${a.id}')">Редагувати</button>
        ${a.status === 'draft'
          ? `<button class="btn btn--small" onclick="publishArticle('${a.id}')">Опублікувати</button>`
          : `<button class="btn btn--small btn--outline" onclick="unpublishArticle('${a.id}')">У черновики</button>`}
        <button class="btn btn--small btn--danger" onclick="deleteArticle('${a.id}')">Видалити</button>
      </div>
    </div>
  `).join('');
}

// ===== Дії зі статтями =====
async function publishArticle(id) {
  await supabaseClient.from('articles').update({ status: 'published' }).eq('id', id);
  loadMyArticles();
}

async function unpublishArticle(id) {
  await supabaseClient.from('articles').update({ status: 'draft' }).eq('id', id);
  loadMyArticles();
}

async function deleteArticle(id) {
  if (!confirm('Видалити цю статтю назавжди?')) return;
  await supabaseClient.from('articles').delete().eq('id', id);
  loadMyArticles();
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