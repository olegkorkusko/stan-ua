import { NextResponse } from 'next/server'

import { sendMessage } from '@/lib/telegram'

/*
  Telegram стукає сюди, коли комусь є що сказати боту.

  Потрібно це рівно для одного: щоб власниця сама дізналась свій номер чату й
  вставила його в налаштування. Раніше номер знав лише той, хто вміє читати
  Telegram API, — тобто ми. Виходило безглуздо: людина натискає «Почати», бот
  мовчить, і треба писати розробнику, щоб той подивився й додав її в список.

  Тепер бот одразу відповідає номером, і далі вона робить усе сама.

  Секрет у заголовку обовʼязковий: адреса вебхука публічна, і без перевірки
  сюди міг би постукати будь-хто. Telegram надсилає той самий рядок, який ми
  вказали при реєстрації вебхука.
*/
export const POST = async (request: Request) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret && request.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    return NextResponse.json({ error: 'Не той секрет' }, { status: 403 })
  }

  const update = (await request.json().catch(() => null)) as {
    message?: { chat?: { id?: number; type?: string }; text?: string }
  } | null

  const chat = update?.message?.chat
  // Відповідаємо лише в особистих, і лише на текст. Групи й канали бот не чіпає.
  if (chat?.type !== 'private' || typeof chat.id !== 'number') {
    return NextResponse.json({ ok: true })
  }

  await sendMessage(
    chat.id,
    [
      '<b>Ваш номер для сповіщень:</b>',
      `<code>${chat.id}</code>`,
      '',
      'Вставте його в адмінці: Налаштування сайту → Контакти → «Telegram для сповіщень про замовлення».',
      'Після цього повідомлення про кожне оплачене замовлення приходитимуть сюди.',
    ].join('\n'),
  ).catch(() => undefined)

  return NextResponse.json({ ok: true })
}
