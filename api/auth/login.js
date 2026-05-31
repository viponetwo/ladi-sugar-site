module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  const { password } = req.body;
  const correctPass = process.env.ADMIN_PASSWORD;

  if (!correctPass) {
    return res.status(500).json({ message: 'Ошибка сервера: ADMIN_PASSWORD не настроен в Vercel' });
  }

  if (password === correctPass) {
    // Генерируем токен ТОЛЬКО на основе пароля (base64)
    const token = Buffer.from(correctPass).toString('base64');
    return res.status(200).json({ success: true, token });
  }

  return res.status(401).json({ success: false, message: 'Неверный пароль' });
}
