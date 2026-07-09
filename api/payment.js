/**
 * POST /api/payment — webhook от GetPlatinum (notificationUrl).
 * После успешной оплаты отправляет сообщение в Telegram.
 */

var common = require('../lib/common');

function pick(obj, keys) {
  if (!obj || typeof obj !== 'object') return '';
  for (var i = 0; i < keys.length; i++) {
    if (obj[keys[i]] != null && obj[keys[i]] !== '') {
      return String(obj[keys[i]]);
    }
  }
  return '';
}

function flattenPayload(body) {
  if (!body) return '';
  if (typeof body === 'string') return body;
  try {
    return JSON.stringify(body);
  } catch (err) {
    return String(body);
  }
}

function detectPaymentStatus(body, raw) {
  var text = flattenPayload(body);
  var combined = (raw || '') + ' ' + text;

  if (/paymentStatusSuccess/i.test(combined)) return 'success';
  if (/paymentStatusFail/i.test(combined)) return 'fail';

  var status = pick(body, ['status', 'paymentStatus', 'event', 'type', 'method']).toLowerCase();
  if (/success|paid|completed|approved/.test(status)) return 'success';
  if (/fail|error|declined|cancel/.test(status)) return 'fail';

  if (body && body.result && body.result.method) {
    var method = String(body.result.method).toLowerCase();
    if (/success|paid|credit/.test(method)) return 'success';
    if (/fail|error/.test(method)) return 'fail';
  }

  return 'unknown';
}

function extractPaymentInfo(body) {
  var root = body || {};
  var data = root.data || root.result && root.result.data || root.payment || root;

  var client = data.clientParams || root.clientParams || data.client || {};
  var custom = data.customParams || root.customParams || {};

  return {
    dealId: pick(root, ['dealId', 'deal_id', 'orderId', 'order_id']) || pick(data, ['dealId', 'deal_id', 'id']),
    name: pick(client, ['name', 'fullName', 'full_name']) || pick(data, ['name']),
    phone: pick(client, ['phone', 'phoneNumber', 'phone_number']) || pick(data, ['phone']),
    telegram: pick(custom, ['telegram']) || pick(client, ['telegram', 'username']),
    amount: pick(data, ['amount', 'price', 'sum']) || pick(root, ['amount', 'price']),
    currency: pick(data, ['currency']) || pick(root, ['currency']) || 'RUB'
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  var body = req.body || {};
  var rawBody = typeof body === 'string' ? body : '';

  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (err) {
      body = { event: body };
    }
  }

  console.log('GetPlatinum webhook:', flattenPayload(body));

  var status = detectPaymentStatus(body, rawBody);

  if (status === 'unknown') {
    return res.status(200).json({ ok: true, ignored: true });
  }

  if (status === 'fail') {
    var failInfo = extractPaymentInfo(body);
    try {
      await common.sendTelegram([
        '⚠️ Оплата не прошла · игра «Система»',
        '',
        failInfo.name ? '👤 Имя: ' + failInfo.name : '',
        failInfo.phone ? '📞 Телефон: ' + failInfo.phone : '',
        failInfo.dealId ? '🆔 Заказ: ' + failInfo.dealId : '',
        '',
        '🕐 ' + common.moscowTimestamp()
      ].filter(Boolean).join('\n'));
    } catch (err) {
      console.error('Payment fail notify error:', err);
    }
    return res.status(200).json({ ok: true, status: 'fail' });
  }

  var info = extractPaymentInfo(body);
  var amountLine = info.amount
    ? '💰 Сумма: ' + info.amount + (info.currency ? ' ' + info.currency : '')
    : '';

  var lines = [
    '🎮 Оплата за игру «Система»',
    '✅ Статус: Оплачено',
    '',
    info.name ? '👤 Имя: ' + info.name : '',
    info.phone ? '📞 Телефон: ' + info.phone : '',
    info.telegram ? '✈️ Telegram: ' + common.formatTelegram(info.telegram) : '',
    amountLine,
    info.dealId ? '🆔 Заказ: ' + info.dealId : '',
    '',
    '🕐 ' + common.moscowTimestamp()
  ].filter(Boolean);

  try {
    await common.sendTelegram(lines.join('\n'));
    return res.status(200).json({ ok: true, status: 'success' });
  } catch (err) {
    console.error('Payment webhook handler error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to notify Telegram' });
  }
};
