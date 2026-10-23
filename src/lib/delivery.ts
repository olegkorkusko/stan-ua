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

/*
  Оплата лише карткою. Накладений платіж прибрано: ті гроші збирає Нова Пошта
  повз платіжну систему, тому фіскальний чек на них ПРРО не виб'є, а виписувати
  його вручну на кожну посилку ніхто не буде. Замовлення в базі, оформлені
  раніше, можуть мати 'cod' — поле в Orders лишається, щоб історія читалась.
*/
export const PAYMENT_METHODS = ['card'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const deliveryMethodOptions: { label: string; value: DeliveryMethod }[] = [
  { label: 'Нова Пошта — відділення', value: 'np_branch' },
  { label: 'Нова Пошта — поштомат', value: 'np_locker' },
  { label: "Нова Пошта — кур'єр", value: 'np_courier' },
  { label: 'Укрпошта', value: 'ukrposhta' },
]

export const paymentMethodOptions: { label: string; value: PaymentMethod }[] = [
  { label: 'Карткою онлайн', value: 'card' },
]

/*
  Те саме плюс знятий накладений платіж — для полів, які читають уже оформлені
  замовлення. Прибрати 'cod' із самої бази не можна: у старих замовленнях воно
  записане, і звуження enum поклало б міграцію на першому ж такому рядку.
*/
export const storedPaymentMethodOptions: { label: string; value: string }[] = [
  ...paymentMethodOptions,
  { label: 'Накладений платіж (більше не приймається)', value: 'cod' },
]

const isOneOf = <T extends string>(values: readonly T[], value: unknown): value is T =>
  typeof value === 'string' && (values as readonly string[]).includes(value)

export const asDeliveryMethod = (value: unknown): DeliveryMethod | undefined =>
  isOneOf(DELIVERY_METHODS, value) ? value : undefined

export const asPaymentMethod = (value: unknown): PaymentMethod | undefined =>
  isOneOf(PAYMENT_METHODS, value) ? value : undefined


/**
 * Сума, з якої доставка безкоштовна — запасне значення.
 *
 * Справжній поріг клієнтка задає в «Налаштуваннях сайту»; сюди кошик падає
 * лише поки поле порожнє. Число з макета «Кошик» 122:2723: при 2 060 ₴ у
 * кошику бракує 440 ₴.
 */
export const FREE_DELIVERY_FROM = 2500

/*
  Рядок доставки для службових повідомлень — у Telegram власниці й у лист.

  Доти в повідомленні були лише товар, сума й контакти: куди відправляти,
  доводилось дивитись в адмінці. Зібрати посилку з самого повідомлення було
  не можна, і за кожним замовленням доводилось іти в браузер.

  Складається тут, а не в кожному з трьох повідомлень окремо (Telegram про
  неоплачене, Telegram про оплачене, лист власниці): вони різні, а адреса в
  них має бути однакова.
*/
export const deliveryLine = (order: {
  deliveryMethod?: string | null
  deliveryCity?: string | null
  deliveryBranch?: string | null
  deliveryPostcode?: string | null
}): string | null => {
  const method = order.deliveryMethod
  // Цифрове замовлення — самі курси, відправляти нічого.
  if (!method) return null

  const label = deliveryMethodOptions.find((option) => option.value === method)?.label ?? method
  const where = [order.deliveryCity?.trim(), order.deliveryBranch?.trim()].filter(Boolean).join(', ')
  const postcode = method === 'ukrposhta' ? order.deliveryPostcode?.trim() : undefined

  return [label, where, postcode].filter(Boolean).join(' · ')
}
