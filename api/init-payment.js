/**
 * POST /api/init-payment — создаёт персональную ссылку на оплату GetPlatinum.
 *
 * Env:
 *   GETPLATINUM_ACCOUNT  — shkarov-dmitrii
 *   GETPLATINUM_API_KEY
 *   BOT_PUBLIC_URL       — https://sistema-game-bot.vercel.app
 *   PAYMENT_SUCCESS_URL  — опционально
 *   PAYMENT_FAIL_URL     — опционально
 */

var common = require('../lib/common');

function buildDealId() {
  return 'sistema-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    common.setCors(req, res);
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  common.setCors(req, res);

  var account = process.env.GETPLATINUM_ACCOUNT || 'shkarov-dmitrii';
  var apiKey = process.env.GETPLATINUM_API_KEY;
  var botUrl = (process.env.BOT_PUBLIC_URL || 'https://sistema-game-bot.vercel.app').replace(/\/$/, '');

  if (!apiKey) {
    return res.status(500).json({ ok: false, error: 'GetPlatinum API is not configured' });
  }

  var body = req.body || {};
  var name = common.sanitize(body.name, 120);
  var phone = common.sanitize(body.phone, 40);
  var telegram = common.sanitize(body.telegram, 64).replace(/^@+/, '');
  var amount = Number(body.amount || body.price || 2900);
  var currency = common.sanitize(body.currency || 'RUB', 8).replace('₽', 'RUB') || 'RUB';
  var productName = common.sanitize(body.productName || 'Участие в игре «Система»', 200);
  var eventInfo = body.event || {};
  var dealId = common.sanitize(body.dealId || buildDealId(), 80);

  if (!name || !phone) {
    return res.status(400).json({ ok: false, error: 'Name and phone are required' });
  }

  if (!amount || amount < 1) {
    return res.status(400).json({ ok: false, error: 'Invalid amount' });
  }

  var successUrl = common.sanitize(
    body.successUrl || process.env.PAYMENT_SUCCESS_URL || 'https://sistema-game-vert.vercel.app/',
    500
  );
  var failUrl = common.sanitize(
    body.failUrl || process.env.PAYMENT_FAIL_URL || 'https://sistema-game-vert.vercel.app/',
    500
  );

  var payload = {
    dealId: dealId,
    currency: currency === '₽' ? 'RUB' : currency,
    amount: amount,
    positions: [
      {
        prefix: Number(process.env.GETPLATINUM_VAT_PREFIX) || 12,
        name: productName,
        price: amount,
        quantity: 1,
        vat: 'none'
      }
    ],
    clientParams: {
      clientId: dealId,
      phone: phone,
      name: name,
      email: common.sanitize(body.email, 120)
    },
    notificationUrl: botUrl + '/api/payment',
    successUrl: successUrl,
    failUrl: failUrl,
    customParams: {
      telegram: telegram,
      source: 'sistema-game',
      eventDate: common.sanitize(eventInfo.date, 40),
      eventCity: common.sanitize(eventInfo.city, 40)
    }
  };

  var apiUrl = 'https://' + account + '.getplatinum.ru/api/public/pay/init-payment-url';

  try {
    var gpResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + apiKey
      },
      body: JSON.stringify(payload)
    });

    var gpData = await gpResponse.json().catch(function () {
      return {};
    });

    if (!gpResponse.ok) {
      console.error('GetPlatinum init-payment error:', gpResponse.status, gpData);
      return res.status(502).json({
        ok: false,
        error: gpData.message || gpData.error || 'GetPlatinum request failed'
      });
    }

    var formUrl = gpData.formUrl || gpData.data && gpData.data.formUrl;
    var errorCode = gpData.errorCode != null ? gpData.errorCode : gpData.data && gpData.data.errorCode;

    if (errorCode !== 0 && errorCode !== '0' && errorCode != null) {
      console.error('GetPlatinum business error:', gpData);
      return res.status(502).json({
        ok: false,
        error: gpData.errorMessage || gpData.message || 'GetPlatinum returned error'
      });
    }

    if (!formUrl) {
      console.error('GetPlatinum response without formUrl:', gpData);
      return res.status(502).json({ ok: false, error: 'Payment URL was not returned' });
    }

    return res.status(200).json({
      ok: true,
      formUrl: formUrl,
      dealId: dealId
    });
  } catch (err) {
    console.error('init-payment handler error:', err);
    return res.status(500).json({ ok: false, error: 'Server error' });
  }
};
