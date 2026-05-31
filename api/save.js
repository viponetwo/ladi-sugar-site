// api/save.js

export default async function handler(req, res) {
  // Разрешаем запросы только методом POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { content } = req.body; // Получаем JSON данные от админки

  if (!content) {
    return res.status(400).json({ message: 'No content provided' });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_USER = 'viponetwo'; // ЗАМЕНИТЕ НА СВОЙ ЛОГИН
  const GITHUB_REPO = 'ladi-sugar-site'; // ЗАМЕНИТЕ НА ИМЯ РЕПОЗИТОРИЯ
  const FILE_PATH = 'data.json';
  const BRANCH = 'main'; // Или master

  try {
    // 1. Получаем текущий SHA файла (нужен для обновления)
    const getRes = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    let sha = null;
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    } else if (getRes.status === 404) {
      console.log('File not found, will create new.');
    } else {
      throw new Error('Failed to fetch file info');
    }

    // 2. Кодируем контент в Base64
    const base64Content = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    // 3. Отправляем обновленный файл на GitHub
    const putRes = await fetch(
      `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Update data via Admin Panel',
          content: base64Content,
          branch: BRANCH,
          sha: sha, // Если файл новый, sha можно не указывать или оставить null
        }),
      }
    );

    if (putRes.ok) {
      return res.status(200).json({ message: 'Success! Site will update in ~1 min.' });
    } else {
      const error = await putRes.json();
      return res.status(500).json({ message: 'GitHub Error', details: error.message });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
