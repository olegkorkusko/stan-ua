/**
 * Meta Conversions API — серверна подія покупки.
 *
 * Навіщо, якщо є піксель у браузері: блокувальники реклами й ITP у Safari
 * ріжуть частину подій, і в кабінеті Meta покупок видно менше, ніж було
 * насправді. Алгоритм оптимізує рекламу за тим, що бачить, тому недолік
 * подій — це не косметика звітів, а гірші результати реклами.
 *
 * Подія з браузера і подія звідси мають однаковий `event_id` (номер
 * замовлення) — Meta склеює їх у одну й не рахує покупку двічі.
 *
 * Без `META_CONVERSIONS_TOKEN` у .env інтеграція мовчки вимикається.
 */
import crypto from 'crypto'

// Версію Graph API Meta підтримує ~2 роки. Коли термін вийде — підняти тут.
const API_VERSION = 'v22.0'

type PurchaseEvent = {
  orderNumber: string
  email: string
  phone?: string
  name?: string
  total: number
  items: { id: string; quantity: number; price: number }[]
  /** Кукі браузера `_fbp` і `_fbc` — головні ключі зіставлення з користувачем. */
  fbp?: string
  fbc?: string
}

export const isConfigured = (): boolean =>
  Boolean(process.env.META_CONVERSIONS_TOKEN && process.env.NEXT_PUBLIC_META_PIXEL_ID)

/** Meta приймає персональні дані лише у вигляді SHA-256 від нормалізованого рядка. */
const hash = (value: string): string =>
  crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')

/**
 * Телефон Meta очікує з кодом країни й без розділювачів: 380671234567.
 * Українські номери приходять у вигляді «+38 (067) 123-45-67» або «0671234567».
 */
const normalizePhone = (raw: string): string | null => {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('380') && digits.length === 12) return digits
  if (digits.startsWith('0') && digits.length === 10) return `38${digits}`
  if (digits.length === 9) return `380${digits}`
  return digits.length >= 10 ? digits : null
}

export const sendPurchase = async (event: PurchaseEvent): Promise<boolean> => {
  if (!isConfigured()) return false

  const phone = event.phone ? normalizePhone(event.phone) : null
  const firstName = event.name?.trim().split(/\s+/)[0]
  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? ''

  // IP покупця свідомо не передаємо: зіставлення тримається на пошті, телефоні
  // та `_fbp`, а зайві персональні дані краще не збирати й не зберігати.
  const userData: Record<string, unknown> = {
    em: [hash(event.email)],
    ...(phone ? { ph: [hash(phone)] } : {}),
    ...(firstName ? { fn: [hash(firstName)] } : {}),
    ...(event.fbp ? { fbp: event.fbp } : {}),
    ...(event.fbc ? { fbc: event.fbc } : {}),
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${process.env.NEXT_PUBLIC_META_PIXEL_ID}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: process.env.META_CONVERSIONS_TOKEN,
          data: [
            {
              event_name: 'Purchase',
              event_time: Math.floor(Date.now() / 1000),
              event_id: event.orderNumber,
              action_source: 'website',
              ...(base ? { event_source_url: `${base}/checkout/thanks` } : {}),
              user_data: userData,
              custom_data: {
                currency: 'UAH',
                value: event.total,
                order_id: event.orderNumber,
                content_type: 'product',
                contents: event.items.map((item) => ({
                  id: item.id,
                  quantity: item.quantity,
                  item_price: item.price,
                })),
              },
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      console.error('Meta CAPI: подію не прийнято', await response.text())
      return false
    }

    return true
  } catch (error) {
    console.error('Meta CAPI не відповів', error)
    return false
  }
}
