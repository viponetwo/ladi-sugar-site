module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const token = req.body.token || req.headers.authorization?.split(' ')[1];
  const expectedToken = Buffer.from(process.env.ADMIN_PASSWORD || '').toString('base64');

  // ✅ Теперь проверка совпадает с генерацией в login.js
  if (!token || token !== expectedToken) {
    return res.status(401).json({ message: 'Недействительная сессия' });
  }

  const { content } = req.body;
  if (!content) return res.status(400).json({ message: 'Нет данных для сохранения' });

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const USER = 'viponetwo'; // ← ЗАМЕНИТЕ
  const REPO = 'ladi-sugar-site'; // ← ЗАМЕНИТЕ
  const BRANCH = 'main'; // ← main или master
  const PATH = 'data.json';

  try {
    console.log('📡 Fetching current file SHA...');
    const getRes = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${PATH}?ref=${BRANCH}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github+json' }
    });

    let sha = null;
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    } else if (getRes.status !== 404) {
      const err = await getRes.json();
      throw new Error(`GitHub GET failed: ${err.message}`);
    }

    const base64Content = Buffer.from(JSON.stringify(content, null, 2)).toString('base64');

    console.log('🚀 Sending PUT request to GitHub...');
    const putRes = await fetch(`https://api.github.com/repos/${USER}/${REPO}/contents/${PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: '🤖 Update data.json via Admin', content: base64Content, branch: BRANCH, sha: sha || undefined })
    });

    if (putRes.ok) {
      const commitData = await putRes.json();
      console.log('✅ GitHub Commit Success:', commitData.commit?.sha);
      return res.status(200).json({ message: '✅ Committed successfully!', sha: commitData.commit?.sha });
    } else {
      const err = await putRes.json();
      console.error('❌ GitHub PUT Error:', err);
      return res.status(500).json({ message: 'GitHub API Error', details: err.message });
    }
  } catch (error) {
    console.error('💥 Server Exception:', error.message);
    return res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
}
