const API = 'https://api.telegram.org/bot'

const token = () => process.env.TELEGRAM_BOT_TOKEN ?? ''

const call = async <T>(method: string, body: Record<string, unknown>): Promise<T | null> => {
  if (!token()) return null
  try {
    const response = await fetch(`${API}${token()}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await response.json()) as { ok: boolean; result?: T; description?: string }
    if (!data.ok) {
      console.error(`Telegram ${method}: ${data.description}`)
      return null
    }
    return data.result ?? null
  } catch (error) {
    console.error(`Telegram ${method} впав`, error)
    return null
  }
}

/**
 * Персональне запрошення в закритий канал курсу: одне посилання — одна людина.
 * Термін дії обмежений добою, щоб посилання не розходилось далі, але сам
 * доступ у каналі лишається назавжди.
 *
 * Бот має бути адміністратором каналу з правом «Invite users via link».
 */
export const createCourseInvite = async (chatId: string, courseTitle: string): Promise<string | null> => {
  const result = await call<{ invite_link: string }>('createChatInviteLink', {
    chat_id: chatId,
    name: courseTitle.slice(0, 32),
    member_limit: 1,
    expire_date: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  })
  return result?.invite_link ?? null
}

/** Сповіщення власниці про нове оплачене замовлення. */
export const notifyAdmin = async (text: string): Promise<void> => {
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!chatId) return
  await call('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' })
}

/** Публікація розсилки у відкритий Telegram-канал бренду. */
export const broadcastToChannel = async (text: string): Promise<void> => {
  const chatId = process.env.TELEGRAM_BROADCAST_CHAT_ID
  if (!chatId) return
  await call('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' })
}
