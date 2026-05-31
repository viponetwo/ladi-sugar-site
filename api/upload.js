module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const USER = 'viponetwo'; // ← ЗАМЕНИТЕ (как в save.js)
  const REPO = 'ladi-sugar-site'; // ← ЗАМЕНИТЕ
  const BRANCH = 'main';

  try {
    const { fileName, contentBase64 } = req.body;
    if (!fileName || !contentBase64) return res.status(400).json({ message: 'Нет данных файла' });

    // Безопасное имя + timestamp для уникальности
    const safeName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const path = `images/uploads/${safeName}`;

    // Проверяем, существует ли файл (для получения sha при обновлении)
    const getRes = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${path}?ref=${BRANCH}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }
    });

    let sha = null;
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    } else if (getRes.status !== 404) {
      throw new Error('GitHub API error');
    }

    // Отправляем файл в репозиторий
    const putRes = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${path}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `📤 Upload image: ${safeName}`,
        content: contentBase64,
        branch: BRANCH,
        sha: sha || undefined
      })
    });

    if (putRes.ok) {
      // Возвращаем путь, который Vercel сразу будет отдавать как статический файл
      return res.status(200).json({ url: `/images/uploads/${safeName}` });
    } else {
      const err = await putRes.json();
      return res.status(500).json({ message: err.message || 'Upload failed' });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
