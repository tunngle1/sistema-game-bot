/**
 * TODO: webhook от платёжки (Prodamus / ЮKassa / Tinkoff).
 * После успешной оплаты — отправить в Telegram то же сообщение со статусом «Оплачено».
 *
 * POST /api/payment
 * Body: { name, phone, telegram, amount, paymentId }
 */

module.exports = async function handler(req, res) {
  return res.status(501).json({
    ok: false,
    error: 'Payment webhook not configured yet'
  });
};
