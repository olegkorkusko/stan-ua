/*
  Способи доставки, оплати й чека — в одному місці.

  Раніше перелік відділень жив тільки в `Orders`. Тепер ті самі значення
  потрібні профілю покупця («Дані для доставки» в кабінеті, 138:3085), і друга
  копія списку одразу почала б розходитися: додали б поштомат у замовлення —
  і профіль про нього не знав би.

  Підписи тут українські, бо йдуть в адмінку, яка одномовна. Фронтенд бере
  свої — двомовні — зі словника `i18n`, ключами за цими ж значеннями.
*/

export const DELIVERY_METHODS = ['np_branch', 'np_locker', 'np_courier', 'ukrposhta'] as const
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]

export const PAYMENT_METHODS = ['card', 'cod'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

/** Куди надсилати фіскальний чек. ПРРО вміє і пошту, і SMS. */
export const RECEIPT_CHANNELS = ['email', 'sms'] as const
export type ReceiptChannel = (typeof RECEIPT_CHANNELS)[number]

export const deliveryMethodOptions: { label: string; value: DeliveryMethod }[] = [
  { label: 'Нова Пошта — відділення', value: 'np_branch' },
  { label: 'Нова Пошта — поштомат', value: 'np_locker' },
  { label: "Нова Пошта — кур'єр", value: 'np_courier' },
  { label: 'Укрпошта', value: 'ukrposhta' },
]

export const paymentMethodOptions: { label: string; value: PaymentMethod }[] = [
  { label: 'Карткою онлайн', value: 'card' },
  { label: 'Накладений платіж', value: 'cod' },
]

export const receiptChannelOptions: { label: string; value: ReceiptChannel }[] = [
  { label: 'На пошту', value: 'email' },
  { label: 'У SMS', value: 'sms' },
]

const isOneOf = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (values as readonly string[]).includes(value)

export const asDeliveryMethod = (value: unknown): DeliveryMethod | undefined =>
  isOneOf(DELIVERY_METHODS, value) ? value : undefined

export const asPaymentMethod = (value: unknown): PaymentMethod | undefined =>
  isOneOf(PAYMENT_METHODS, value) ? value : undefined

export const asReceiptChannel = (value: unknown): ReceiptChannel | undefined =>
  isOneOf(RECEIPT_CHANNELS, value) ? value : undefined

/**
 * Сума, з якої доставка безкоштовна — запасне значення.
 *
 * Справжній поріг клієнтка задає в «Налаштуваннях сайту»; сюди кошик падає
 * лише поки поле порожнє. Число з макета «Кошик» 122:2723: при 2 060 ₴ у
 * кошику бракує 440 ₴.
 */
export const FREE_DELIVERY_FROM = 2500

/**
 * Передплата за накладений платіж: або фіксована сума, або відсоток від
 * замовлення — як задано в «Налаштуваннях сайту».
 *
 * Живе тут, а не в маршруті оформлення, бо рахувати це треба двічі: сервер
 * визначає, скільки списати онлайн, а форма показує покупцеві «зараз стільки,
 * при отриманні стільки». Дві копії формули неминуче розійшлися б — і людина
 * бачила б одну суму, а платила іншу.
 */
export const prepaymentFor = (
  total: number,
  type: string | null | undefined,
  amount: number | null | undefined,
): number => {
  const value = amount ?? 200
  const raw =
    type === 'percent' ? Math.round((total * Math.min(Math.max(value, 0), 100)) / 100) : value
  return Math.min(Math.max(raw, 0), total)
}
