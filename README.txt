TELEGRAM-БОТ ДЛЯ ЗАЯВОК «СИСТЕМА»
================================

GitHub: https://github.com/tunngle1/sistema-game-bot

Отдельный мини-проект: принимает POST с сайта и шлёт заявку в Telegram.
Деплоится отдельно от лендинга (свой проект на Vercel).

СТРУКТУРА
---------
bot/
  api/register.js   — endpoint POST /api/register
  package.json
  .env.example
  README.txt

НАСТРОЙКА БОТА
--------------
1. Telegram → @BotFather → /newbot → скопируйте TELEGRAM_BOT_TOKEN
2. Напишите боту любое сообщение
3. Откройте в браузере:
   https://api.telegram.org/bot<TOKEN>/getUpdates
   Найдите "chat":{"id": ...} — это TELEGRAM_CHAT_ID
   (для группы ID отрицательный; у supergroup начинается с -100)

ДЕПЛОЙ НА VERCEL
----------------
1. vercel.com → Add New Project
2. Root Directory: bot
3. Environment Variables:
   TELEGRAM_BOT_TOKEN
   TELEGRAM_CHAT_ID
   ALLOWED_ORIGIN = URL вашего сайта (например https://sistema-game.vercel.app)
4. Deploy → скопируйте URL, например https://sistema-bot.vercel.app

ПОДКЛЮЧЕНИЕ К САЙТУ
-------------------
В config.js на сайте укажите:

  form: {
    endpoint: 'https://ВАШ-БОТ.vercel.app/api/register'
  }

  payment: {
    paymentUrl: 'https://...'  /* после регистрации — редирект на оплату */
  }

СТАТУСЫ В TELEGRAM
------------------
При регистрации:     📋 Статус: Заявка
После оплаты:        ✅ Статус: Оплачено  (webhook /api/payment)

ENDPOINTS
---------
POST /api/register      — заявка с сайта
POST /api/init-payment  — создать ссылку GetPlatinum (notificationUrl → /api/payment)
POST /api/payment       — webhook от GetPlatinum после оплаты

ENV НА VERCEL (бот)
-------------------
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
GETPLATINUM_ACCOUNT=shkarov-dmitrii
GETPLATINUM_API_KEY
BOT_PUBLIC_URL=https://sistema-game-bot.vercel.app
PAYMENT_SUCCESS_URL=https://sistema-game-vert.vercel.app/
PAYMENT_FAIL_URL=https://sistema-game-vert.vercel.app/

После добавления переменных — Redeploy бота.

ЛОКАЛЬНЫЙ ТЕСТ
--------------
cd bot
npm i -g vercel
vercel dev

Сайт локально должен слать запрос на http://localhost:3000/api/register
(в config.js временно поставьте этот URL).
