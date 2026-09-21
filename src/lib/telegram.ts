const API = 'https://api.telegram.org/bot'

const token = () => process.env.TELEGRAM_BOT_TOKEN ?? ''

type Reply<T> = { result: T | null; error: string | null }

/*
  Два рівні навколо одного запиту.

  `request` віддає ще й текст помилки від Telegram — він потрібен перевірці
  каналу, щоб пояснити власниці, що саме не так: канал не знайдено, бот не
  доданий чи прав бракує. `call` лишає звичну поведінку «або результат, або
  null» для тих місць, де причина нічого не змінює.
*/
const request = async <T>(method: string, body: Record<string, unknown>): Promise<Reply<T>> => {
  if (!token()) return { result: null, error: null }
  try {
    const response = await fetch(`${API}${token()}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = (await response.json()) as { ok: boolean; result?: T; description?: string }
    if (!data.ok) {
      console.error(`Telegram ${method}: ${data.description}`)
      return { result: null, error: data.description ?? 'невідома помилка' }
    }
    return { result: data.result ?? null, error: null }
  } catch (error) {
    console.error(`Telegram ${method} впав`, error)
    return { result: null, error: 'немає звʼязку з Telegram' }
  }
}

const call = async <T>(method: string, body: Record<string, unknown>): Promise<T | null> =>
  (await request<T>(method, body)).result

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

/**
 * Чи зможе бот видати доступ до цього каналу — перевірка ДО першого продажу.
 *
 * Без неї помилка в id каналу або незданий ботові доступ виявляються аж тоді,
 * коли покупець уже заплатив: createChatInviteLink повертає null, лист іде без
 * посилання, і ніхто нічого не помічає.
 *
 * Повертає null, якщо все гаразд, або причину — людською мовою, бо її читає
 * власниця в адмінці, а не розробник у логах.
 *
 * Без токена не перевіряємо нічого: локально й на тестовому оточенні його може
 * не бути, і блокувати там збереження курсу немає за що.
 */
export const courseChannelProblem = async (chatId: string): Promise<string | null> => {
  if (!token()) return null

  const me = await request<{ id: number }>('getMe', {})
  if (!me.result) return me.error ? `Telegram: ${me.error}` : null

  const member = await request<{ status: string; can_invite_users?: boolean }>('getChatMember', {
    chat_id: chatId,
    user_id: me.result.id,
  })

  if (!member.result) {
    return `Канал не знайдено або бот до нього не доданий (${member.error ?? 'без деталей'})`
  }
  if (member.result.status !== 'administrator') {
    return 'Бот доданий у канал, але не адміністратор — зробіть його адміністратором'
  }
  if (!member.result.can_invite_users) {
    return 'У бота немає права «Запрошувати користувачів через посилання» — увімкніть його в налаштуваннях адміністратора'
  }
  return null
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
