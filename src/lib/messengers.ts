/**
 * Посилання на чат у месенджері з того, що вписали в адмінці.
 *
 * Клієнтка вписує як їй зручно: номер у будь-якому вигляді, нік або готове
 * посилання. Раніше поле Telegram приймало лише посилання, і номер у ньому
 * мовчки перетворювався на битий href. Тепер розбираємо всі три випадки в
 * одному місці — ним користується і підвал, і кнопки звʼязку.
 *
 * Номер нормалізуємо так само, як для Meta: Україна пише його то з +38, то з
 * нуля, то без нічого, а месенджери хочуть суцільні цифри з кодом країни.
 */
export const messengerLink = (
  value: string | null | undefined,
  kind: 'telegram' | 'whatsapp',
): string | null => {
  const raw = value?.trim()
  if (!raw) return null

  // Готове посилання лишаємо як є: там може бути і t.me, і chat.whatsapp,
  // і будь-що інше, що клієнтка скопіювала з самого месенджера.
  if (/^https?:\/\//i.test(raw)) return raw

  // Нік буває лише в Telegram. У WhatsApp літери означають помилку вводу,
  // і краще не показати кнопку, ніж вести покупця в нікуди.
  const nick = raw.replace(/^@/, '')
  if (/[a-z_]/i.test(nick)) return kind === 'telegram' ? `https://t.me/${nick}` : null

  const digits = raw.replace(/\D/g, '')
  if (digits.length < 9) return null
  const phone = digits.startsWith('380')
    ? digits
    : digits.startsWith('0')
      ? `38${digits}`
      : digits.length === 9
        ? `380${digits}`
        : digits

  // Telegram шукає за номером тільки з плюсом, WhatsApp — тільки без нього.
  return kind === 'telegram' ? `https://t.me/+${phone}` : `https://wa.me/${phone}`
}
