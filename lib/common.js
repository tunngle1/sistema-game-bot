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

function setCors(req, res) {
  var requestOrigin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', requestOrigin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (requestOrigin) res.setHeader('Vary', 'Origin');
  return true;
}

async function sendTelegram(text) {
  var token = process.env.TELEGRAM_BOT_TOKEN;
  var chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error('Telegram is not configured');
  }

  var tgResponse = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      disable_web_page_preview: true
    })
  });

  var tgData = await tgResponse.json();

  if (!tgResponse.ok || !tgData.ok) {
    console.error('Telegram API error:', tgData);
    throw new Error(tgData.description || 'Failed to send to Telegram');
  }

  return tgData;
}

function moscowTimestamp() {
  return new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
}

module.exports = {
  sanitize: sanitize,
  formatTelegram: formatTelegram,
  setCors: setCors,
  sendTelegram: sendTelegram,
  moscowTimestamp: moscowTimestamp
};
