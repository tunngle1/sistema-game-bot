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
   (для группы ID отрицательный; бота добавьте в группу)

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

ЛОКАЛЬНЫЙ ТЕСТ
--------------
cd bot
npm i -g vercel
vercel dev

Сайт локально должен слать запрос на http://localhost:3000/api/register
(в config.js временно поставьте этот URL).
