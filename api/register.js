/**
 * POST /api/register — отправка заявки с сайта в Telegram.
 *
 * Переменные окружения (Vercel → Settings → Environment Variables):
 *   TELEGRAM_BOT_TOKEN — токен от @BotFather
 *   TELEGRAM_CHAT_ID   — ID чата, куда приходят заявки
 *   ALLOWED_ORIGINS — URL сайта через запятую, например:
 *     https://sistema-game.vercel.app,https://sistema-game-vert.vercel.app
 *   (или ALLOWED_ORIGIN=* чтобы разрешить все)
 */

function sanitize(value, maxLen) {
  return String(value || '')
    .replace(/[\r\n<>]/g, ' ')
    .trim()
    .slice(0, maxLen || 200);
}

function formatTelegram(username) {
  var clean = sanitize(username, 64).replace(/^@+/, '');
  return clean ? '@' + clean : '—';
}

function getAllowedOrigins() {
  var raw = process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGIN || '*';
  if (raw === '*') return null;
  return raw.split(',').map(function (item) {
    return item.trim().replace(/\/$/, '');
  }).filter(Boolean);
}

function setCors(req, res) {
  var requestOrigin = req.headers.origin;
  var allowed = getAllowedOrigins();

  if (allowed === null) {
    res.setHeader('Access-Control-Allow-Origin', requestOrigin || '*');
  } else if (!requestOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowed[0]);
  } else {
    var normalized = requestOrigin.replace(/\/$/, '');
    if (allowed.indexOf(normalized) === -1) {
      return false;
    }
    res.setHeader('Access-Control-Allow-Origin', requestOrigin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Vary', 'Origin');
  return true;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    if (!setCors(req, res)) return res.status(403).end();
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  if (!setCors(req, res)) {
    return res.status(403).json({ ok: false, error: 'Origin not allowed' });
  }

  var token = process.env.TELEGRAM_BOT_TOKEN;
  var chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(500).json({ ok: false, error: 'Telegram is not configured' });
  }

  var body = req.body || {};
  var name = sanitize(body.name, 120);
  var phone = sanitize(body.phone, 40);
  var telegram = formatTelegram(body.telegram);
  var eventInfo = body.event || {};

  if (!name || !phone) {
    return res.status(400).json({ ok: false, error: 'Name and phone are required' });
  }

  var eventLine = [
    eventInfo.date,
    eventInfo.time,
    eventInfo.city,
    eventInfo.format
  ].filter(Boolean).join(' · ');

  var priceLine = eventInfo.price ? eventInfo.price + ' ' + (eventInfo.currency || '₽') : '';

  var lines = [
    '🎮 Новая заявка на игру «Система»',
    '',
    '👤 Имя: ' + name,
    '📞 Телефон: ' + phone,
    '✈️ Telegram: ' + telegram
  ];

  if (priceLine) lines.push('💰 Сумма: ' + priceLine);
  if (eventLine) lines.push('📅 ' + eventLine);
  lines.push('', '🕐 ' + new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' }));

  try {
    var tgResponse = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join('\n'),
        disable_web_page_preview: true
      })
    });

    var tgData = await tgResponse.json();

    if (!tgResponse.ok || !tgData.ok) {
      console.error('Telegram API error:', tgData);
      return res.status(502).json({ ok: false, error: 'Failed to send to Telegram' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Register handler error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
};
