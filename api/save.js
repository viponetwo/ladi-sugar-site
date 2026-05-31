// api/save.js (CommonJS - стабильно работает на Vercel без настроек)
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  console.log('🔍 ENV CHECK: GITHUB_TOKEN exists?', !!token);

  if (!token) {
    return res.status(500).json({
      message: 'Server configuration error: Missing GITHUB_TOKEN',
      hint: 'Проверьте Settings > Environment Variables в Vercel и сделайте новый коммит.'
    });
  }

  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'No content provided' });
  }

  const USER = 'viponetwo'; // ← ЗАМЕНИТЕ НА СВОЙ ЛОГИН GITHUB
  const REPO = 'ladi-sugar-site'; // ← ЗАМЕНИТЕ НА ИМЯ РЕПОЗИТОРИЯ
  const BRANCH = 'main'; // ← ПОМЕНЯЙТЕ НА 'master', ЕСЛИ У ВАС ОНА ТАК НАЗЫВАЕТСЯ
  const PATH = 'data.json';

  try {
    // 1. Получаем SHA файла (нужен для обновления)
    const getRes = await fetch(
      `https://api.github.com/repos/${USER}/${REPO}/contents/${PATH}?ref=${BRANCH}`,
      { headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github+json' } }
    );

    let sha = null;
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    } else if (getRes.status !== 404) {
      const err = await getRes.json();
      throw new Error(`GitHub GET error: ${err.message}`);
    }

    // 2. Кодируем JSON в Base64
    const base64Content = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    // 3. Отправляем файл на GitHub
    const putRes = await fetch(
      `https://api.github.com/repos/${USER}/${REPO}/contents/${PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: '🤖 Update data.json via Admin',
          content: base64Content,
          branch: BRANCH,
          sha: sha || undefined
        })
      }
    );

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
fix api module format
