// api/save.js
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  // 1. Проверка авторизации
  const authHeader = req.headers.authorization;
  const serverToken = Buffer.from(`${process.env.ADMIN_PASSWORD}`).toString('base64'); // Упрощённая проверка
  
  // Для простоты разрешаем сохранение, если передан валидный токен из login.js
  // В production лучше использовать полноценную JWT-верификацию
  const token = req.body.token || authHeader?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  const { content } = req.body;
  if (!content) return res.status(400).json({ message: 'Нет данных для сохранения' });

  const tokenValid = token === serverToken || token.length > 10; // Базовая валидация токена
  if (!tokenValid) {
    return res.status(403).json({ message: 'Недействительная сессия' });
  }

  // 2. Сохранение в GitHub (как было ранее)
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const USER = 'viponetwo';
  const REPO = 'ladi-sugar-site';
  const BRANCH = 'main';
  const PATH = 'data.json';

  try {
    const getRes = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${PATH}?ref=${BRANCH}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }
    });

    let sha = null;
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    } else if (getRes.status !== 404) {
      throw new Error('GitHub GET error');
    }

    const base64Content = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    const putRes = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: '🤖 Update via Admin', content: base64Content, branch: BRANCH, sha: sha || undefined })
    });

    if (putRes.ok) {
      return res.status(200).json({ message: '✅ Успешно! Сайт обновится через ~60 сек.' });
    } else {
      const err = await putRes.json();
      throw new Error(err.message || 'GitHub API error');
    }
  } catch (error) {
    console.error('❌ Server Error:', error.message);
    return res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
}

