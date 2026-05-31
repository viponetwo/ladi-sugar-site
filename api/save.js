// api/save.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('❌ GITHUB_TOKEN не найден в переменных окружения Vercel');
    return res.status(500).json({ message: 'Server configuration error: Missing GITHUB_TOKEN' });
  }

  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'No content provided' });
  }

  const USER = 'ВАШ_НИКНЕЙМ'; // ← ЗАМЕНИТЕ
  const REPO = 'ladi-sugar-site'; // ← ЗАМЕНИТЕ
  const BRANCH = 'main'; // ← main или master
  const PATH = 'data.json';

  try {
    // 1. Проверяем, существует ли файл, и получаем его SHA
    const getUrl = `https://api.github.com/repos/${USER}/${REPO}/contents/${PATH}?ref=${BRANCH}`;
    const getRes = await fetch(getUrl, {
      headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' }
    });

    let sha = null;
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    } else if (getRes.status === 404) {
      console.log('📄 Файл не найден, будет создан новый.');
    } else {
      const err = await getRes.json();
      throw new Error(`GitHub GET error: ${err.message || getRes.statusText}`);
    }

    // 2. Кодируем JSON в Base64
    const base64Content = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    // 3. Отправляем файл на GitHub
    const putUrl = `https://api.github.com/repos/${USER}/${REPO}/contents/${PATH}`;
    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: '🤖 Update data.json via Admin Panel',
        content: base64Content,
        branch: BRANCH,
        sha: sha || undefined // undefined для создания нового файла
      })
    });

    if (putRes.ok) {
      return res.status(200).json({ message: '✅ Успешно! Vercel пересоберёт сайт через ~60 сек.' });
    } else {
      const err = await putRes.json();
      console.error('❌ GitHub PUT error:', err);
      return res.status(500).json({ message: 'GitHub API Error', details: err.message });
    }

  } catch (error) {
    console.error('💥 Server Error:', error.message);
    return res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
}
