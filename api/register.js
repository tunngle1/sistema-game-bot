/**
 * POST /api/register — отправка заявки с сайта в Telegram.
 */

var common = require('../lib/common');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    common.setCors(req, res);
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  common.setCors(req, res);

  var body = req.body || {};
  var name = common.sanitize(body.name, 120);
  var phone = common.sanitize(body.phone, 40);
  var telegram = common.formatTelegram(body.telegram);
  var consentMailing = !!body.consentMailing;
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
    '📋 Статус: Заявка',
    '',
    '👤 Имя: ' + name,
    '📞 Телефон: ' + phone,
    '✈️ Telegram: ' + telegram,
    '📬 Рекламная рассылка: ' + (consentMailing ? 'да' : 'нет')
  ];

  if (priceLine) lines.push('💰 Сумма: ' + priceLine);
  if (eventLine) lines.push('📅 ' + eventLine);
  lines.push('', '🕐 ' + common.moscowTimestamp());

  try {
    await common.sendTelegram(lines.join('\n'));
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Register handler error:', err);
    return res.status(502).json({ ok: false, error: err.message || 'Server error' });
  }
};
