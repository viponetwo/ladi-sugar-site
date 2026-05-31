// api/save.js (ВРЕМЕННЫЙ ДИАГНОСТИЧЕСКИЙ КОД)
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  // Проверяем наличие токена
  const hasToken = !!process.env.GITHUB_TOKEN;
  const tokenLen = hasToken ? process.env.GITHUB_TOKEN.length : 0;
  
  // Выводим безопасный отладочный лог (без значений секретов)
  console.log('🔍 ENV DEBUG:');
  console.log('   GITHUB_TOKEN существует:', hasToken);
  console.log('   Длина токена:', tokenLen, '(ожидается ~40 символов для ghp_)');
  console.log('   Всего переменных в окружении:', Object.keys(process.env).length);

  if (!hasToken) {
    return res.status(500).json({ 
      message: 'Missing GITHUB_TOKEN',
      debug: { exists: false, length: 0 }
    });
  }

  // Если дошли сюда — токен найден!
  return res.status(200).json({ 
    message: '✅ Токен успешно подхвачен сервером!', 
    debug: { exists: true, length: tokenLen }
  });
}
    return res.status(500).json({ message: 'Internal Server Error', details: error.message });
  }
}
