module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { name, text, rating } = req.body;
  if (!name?.trim() || !text?.trim() || !rating) {
    return res.status(400).json({ message: 'Заполните все поля' });
  }
  if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Рейтинг должен быть от 1 до 5' });

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const USER = 'ВАШ_НИКНЕЙМ_GITHUB'; // ← ЗАМЕНИТЕ
  const REPO = 'НАЗВАНИЕ_РЕПОЗИТОРИЯ'; // ← ЗАМЕНИТЕ
  const BRANCH = 'main';
  const PATH = 'data.json';

  try {
    // 1. Получаем текущий data.json
    const getRes = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${PATH}?ref=${BRANCH}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }
    });

    let sha, currentData = { reviews: [] };
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
      currentData = JSON.parse(Buffer.from(fileData.content, 'base64').toString('utf8'));
    } else if (getRes.status !== 404) {
      throw new Error('GitHub API error');
    }

    // 2. Добавляем отзыв со статусом "pending" (ожидает проверки)
    if (!Array.isArray(currentData.reviews)) currentData.reviews = [];
    currentData.reviews.push({
      name: name.trim(),
      text: text.trim(),
      rating: parseInt(rating),
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    });

    // 3. Сохраняем в GitHub
    const base64Content = Buffer.from(JSON.stringify(currentData, null, 2)).toString('base64');
    const putRes = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: '📝 Новый отзыв от посетителя', content: base64Content, branch: BRANCH, sha: sha || undefined })
    });

    if (putRes.ok) {
      return res.status(200).json({ message: '✅ Спасибо! Отзыв появится после проверки.' });
    }
    throw new Error('Save failed');
  } catch (error) {
    console.error('Review submit error:', error);
    return res.status(500).json({ message: 'Ошибка сервера. Попробуйте позже.' });
  }
}
