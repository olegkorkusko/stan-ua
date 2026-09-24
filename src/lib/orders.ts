import crypto from 'crypto'
import type { Payload } from 'payload'

import { createReceipt } from '@/lib/checkbox'
import { formatPrice } from '@/lib/format'
import { sendPurchase } from '@/lib/meta'
import { createCourseInvite, notifyAdmin } from '@/lib/telegram'

export type CartLineInput = {
  kind: 'product' | 'course'
  id: string
  variantId?: string
  quantity?: number
}

export type PricedLine = {
  kind: 'product' | 'course'
  title: string
  quantity: number
  price: number
  product?: number
  course?: number
  variantId?: string
  variantLabel?: string
}

export class CheckoutError extends Error {}

/**
 * Ціни й залишки беремо з бази, а не з кошика браузера. Клієнтський кошик —
 * це лише список того, що людина хоче купити; сума завжди рахується тут.
 */
export const priceCart = async (payload: Payload, input: CartLineInput[]): Promise<PricedLine[]> => {
  if (!Array.isArray(input) || input.length === 0) throw new CheckoutError('Кошик порожній')

  const lines: PricedLine[] = []

  for (const item of input) {
    const quantity = Math.max(1, Math.min(Number(item.quantity) || 1, 99))

    if (item.kind === 'course') {
      const course = await payload.findByID({ collection: 'courses', id: item.id, depth: 0 }).catch(() => null)
      if (!course || course.status !== 'published') throw new CheckoutError('Курс більше не продається')
      lines.push({ kind: 'course', title: course.title, quantity: 1, price: course.price, course: course.id })
      continue
    }

    const product = await payload.findByID({ collection: 'products', id: item.id, depth: 1 }).catch(() => null)
    if (!product || product.status !== 'published') throw new CheckoutError('Товару більше немає в продажу')

    const variants = product.variants ?? []
    const variant = item.variantId ? variants.find((v) => v.id === item.variantId) : undefined

    if (variants.length > 0 && !variant) throw new CheckoutError(`Оберіть варіацію: ${product.title}`)

    const stock = variant ? (variant.stock ?? 0) : (product.stock ?? 0)
    if (stock < quantity) {
      throw new CheckoutError(
        stock === 0
          ? `«${product.title}» закінчився`
          : `«${product.title}»: лишилось ${stock} шт`,
      )
    }

    const colorTitle = variant && typeof variant.color === 'object' ? variant.color?.title : undefined
    const sizeTitle = variant && typeof variant.size === 'object' ? variant.size?.title : undefined

    lines.push({
      kind: 'product',
      title: product.title,
      quantity,
      price: variant?.price ?? product.price,
      product: product.id,
      variantId: variant?.id ?? undefined,
      variantLabel: [colorTitle, sizeTitle].filter(Boolean).join(' · ') || undefined,
    })
  }

  return lines
}

export const applyPromo = async (
  payload: Payload,
  code: string | undefined,
  lines: PricedLine[],
): Promise<{ discount: number; promoId?: number }> => {
  if (!code) return { discount: 0 }

  const found = await payload.find({
    collection: 'promo-codes',
    where: { code: { equals: code.trim().toUpperCase() }, active: { equals: true } },
    limit: 1,
    overrideAccess: true,
  })
  const promo = found.docs[0]
  if (!promo) throw new CheckoutError('Такого промокоду немає')

  const now = Date.now()
  if (promo.validFrom && new Date(promo.validFrom).getTime() > now) throw new CheckoutError('Промокод ще не діє')
  if (promo.validUntil && new Date(promo.validUntil).getTime() < now) throw new CheckoutError('Термін дії промокоду минув')
  if (promo.usageLimit && (promo.usedCount ?? 0) >= promo.usageLimit) throw new CheckoutError('Промокод вичерпано')

  const applicable = lines.filter((line) =>
    promo.appliesTo === 'courses' ? line.kind === 'course' : promo.appliesTo === 'products' ? line.kind === 'product' : true,
  )
  const base = applicable.reduce((sum, line) => sum + line.price * line.quantity, 0)
  if (base === 0) throw new CheckoutError('Промокод не діє на ці позиції')

  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
  if (promo.minOrderTotal && total < promo.minOrderTotal) {
    throw new CheckoutError(`Промокод діє від ${formatPrice(promo.minOrderTotal)}`)
  }

  const discount = promo.type === 'percent' ? Math.round((base * promo.value) / 100) : Math.min(promo.value, base)
  return { discount, promoId: promo.id }
}

/**
 * Списання залишку в транзакції з блокуванням рядка товару.
 *
 * Без `FOR UPDATE` два одночасні замовлення останньої одиниці читають однакове
 * «1 шт», обидва пишуть «0» — і товар продано двічі. Блокування змушує другу
 * транзакцію дочекатись першої й побачити вже оновлене значення.
 *
 * Блокуємо рядок товару, а не варіації: залишок варіації змінюється лише через
 * цю функцію, тож замок на «батькові» дає взаємне виключення і для варіацій.
 */
type DrizzleSession = { db: { execute: (query: string) => Promise<unknown> } }

type DatabaseInternals = {
  sessions?: Record<string, DrizzleSession>
  beginTransaction?: () => Promise<string | number | null>
  commitTransaction?: (id: string | number) => Promise<void>
  rollbackTransaction?: (id: string | number) => Promise<void>
}

/**
 * `SELECT ... FOR UPDATE` у тій самій транзакції, якою пише Payload.
 * Ідентифікатор проганяємо через `Number` — у запит потрапляє тільки число.
 */
const lockProductRow = async (
  db: DatabaseInternals,
  transactionID: string | number,
  productId: number | string,
): Promise<boolean> => {
  const numericId = Number(productId)
  if (!Number.isInteger(numericId)) return false

  const session = db.sessions?.[String(transactionID)]
  if (!session) return false

  await session.db.execute(`SELECT id FROM products WHERE id = ${numericId} FOR UPDATE`)
  return true
}

export const decrementStock = async (
  payload: Payload,
  productId: number | string,
  variantId: string | null,
  quantity: number,
): Promise<void> => {
  const db = payload.db as unknown as DatabaseInternals

  const transactionID = (await db.beginTransaction?.()) ?? null

  try {
    const req = transactionID ? ({ transactionID } as never) : undefined

    // Читаємо залишок тільки після того, як рядок заблоковано: інакше
    // прочитане значення може застаріти ще до запису.
    const locked = transactionID !== null && (await lockProductRow(db, transactionID, productId))
    if (!locked) {
      payload.logger.warn(
        { productId },
        'Залишок списується без блокування рядка: одночасні замовлення можуть перепродати останню одиницю',
      )
    }

    const product = await payload.findByID({
      collection: 'products',
      id: productId,
      depth: 0,
      req,
    })

    const available = variantId
      ? (product.variants?.find((variant) => variant.id === variantId)?.stock ?? 0)
      : (product.stock ?? 0)

    if (available < quantity) {
      // Оплата вже пройшла, тож замовлення не скасовуємо — але власниця має
      // дізнатись про перепродаж одразу, а не з листа покупця.
      payload.logger.error(
        { productId, variantId, quantity, available },
        'Перепродаж: на складі менше, ніж у замовленні',
      )
    }

    if (variantId && product.variants?.length) {
      const variants = product.variants.map((variant) =>
        variant.id === variantId
          ? { ...variant, stock: Math.max(0, (variant.stock ?? 0) - quantity) }
          : variant,
      )
      await payload.update({
        collection: 'products',
        id: productId,
        data: { variants },
        overrideAccess: true,
        req,
      })
    } else {
      await payload.update({
        collection: 'products',
        id: productId,
        data: { stock: Math.max(0, (product.stock ?? 0) - quantity) },
        overrideAccess: true,
        req,
      })
    }

    if (transactionID) await db.commitTransaction?.(transactionID)
  } catch (error) {
    if (transactionID) await db.rollbackTransaction?.(transactionID)
    throw error
  }
}

export const makeOrderNumber = (): string => {
  const now = new Date()
  const date = [now.getFullYear() % 100, now.getMonth() + 1, now.getDate()]
    .map((part) => String(part).padStart(2, '0'))
    .join('')
  return `MK-${date}-${crypto.randomInt(1000, 9999)}`
}

/**
 * Видача доступів і списання залишків після підтвердженої оплати.
 * Викликається з колбека WayForPay і захищена від повторного запуску:
 * WayForPay може надіслати колбек кілька разів.
 */
export const fulfillOrder = async (
  payload: Payload,
  orderId: number | string,
  /** Маска картки з колбека платіжки — останні цифри, які кабінет показує в «Оплаті». */
  card?: { mask?: string },
): Promise<void> => {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 1, overrideAccess: true })
  if (order.accessGranted) return

  const invites: string[] = []
  /*
    Курси, за які заплачено, але доступ видати не вдалось: бот втратив права в
    каналі, канал видалили, Telegram лежить. Мовчки пропустити це не можна —
    гроші вже списано. Власниця дізнається з того ж сповіщення про замовлення,
    покупець — із листа, щоб не думав, що отримав усе.
  */
  const undelivered: string[] = []
  const grants: { course: number; relatedOrder: number; grantedAt: string; telegramInviteLink?: string }[] = []

  for (const item of order.items ?? []) {
    if (item.kind === 'course') {
      const courseId = typeof item.course === 'object' ? item.course?.id : item.course
      if (!courseId) continue
      const course = await payload.findByID({ collection: 'courses', id: courseId, depth: 0 })
      let inviteLink: string | undefined

      const needsTelegram = ['telegram', 'both'].includes(course.accessType)

      if (needsTelegram && course.telegramChatId) {
        const link = await createCourseInvite(course.telegramChatId, course.title)
        if (link) {
          inviteLink = link
          invites.push(`${course.title}: ${link}`)
        } else {
          undelivered.push(course.title)
        }
      } else if (needsTelegram) {
        // Канал не вказано взагалі — публікацію таке вже не проходить, але
        // старі курси могли лишитись без нього.
        undelivered.push(course.title)
      }

      if (['canva', 'both'].includes(course.accessType) && course.canvaUrl) {
        inviteLink = inviteLink ?? course.canvaUrl
        invites.push(`${course.title}: ${course.canvaUrl}`)
      }

      grants.push({
        course: courseId,
        relatedOrder: Number(order.id),
        grantedAt: new Date().toISOString(),
        telegramInviteLink: inviteLink,
      })
      continue
    }

    const productId = typeof item.product === 'object' ? item.product?.id : item.product
    if (!productId) continue
    await decrementStock(payload, productId, item.variantId ?? null, item.quantity)
  }

  /*
    Обліковий запис чіпляємо за поштою до КОЖНОГО виконаного замовлення, а не
    лише до того, у якому були курси. Раніше цей блок стояв під
    `if (grants.length > 0)`, і замовлення самих товарів лишалося без
    `customer`: покупець не бачив його в кабінеті, а «Дані для доставки» не мали
    звідки взятися.

    Тут же оновлюємо профіль доставки — те, що кабінет показує на вкладці
    «Дані для доставки». Пишемо лише заповнене: замовлення самих курсів не має
    ні міста, ні відділення, і порожні значення стерли б те, що покупець уже
    вказував раніше.
  */
  const existing = await payload.find({
    collection: 'customers',
    where: { email: { equals: order.customerEmail } },
    limit: 1,
    overrideAccess: true,
  })

  const customer =
    existing.docs[0] ??
    (await payload.create({
      collection: 'customers',
      overrideAccess: true,
      data: {
        email: order.customerEmail,
        name: order.customerName,
        phone: order.customerPhone,
        password: crypto.randomBytes(16).toString('hex'),
      },
    }))

  await payload.update({
    collection: 'customers',
    id: customer.id,
    overrideAccess: true,
    data: {
      ...(grants.length > 0 ? { access: [...(customer.access ?? []), ...grants] } : {}),
      ...(order.customerName ? { name: order.customerName } : {}),
      ...(order.customerPhone ? { phone: order.customerPhone } : {}),
      ...(order.deliveryMethod ? { deliveryMethod: order.deliveryMethod } : {}),
      ...(order.deliveryCity ? { deliveryCity: order.deliveryCity } : {}),
      ...(order.deliveryBranch ? { deliveryBranch: order.deliveryBranch } : {}),
      // Згоду лише проставляємо, ніколи не знімаємо: відмову від розсилки
      // покупець робить сам, і нове замовлення без галочки її не скасовує.
      ...(order.newsletter ? { subscribedToNewsletter: true } : {}),
      ...(order.paymentMethod ? { paymentMethod: order.paymentMethod } : {}),
      ...(card?.mask ? { cardMask: card.mask } : {}),
    },
  })

  await payload.update({
    collection: 'orders',
    id: orderId,
    data: { customer: customer.id },
    overrideAccess: true,
  })

  const receiptId = await createReceipt({
    orderNumber: order.orderNumber,
    email: order.customerEmail,
    items: (order.items ?? []).map((item) => ({
      name: item.title,
      price: item.price,
      quantity: item.quantity,
    })),
    total: order.prepaidAmount || order.total,
  })

  await payload.update({
    collection: 'orders',
    id: orderId,
    data: {
      accessGranted: true,
      paymentStatus: order.prepaidAmount ? 'partial' : 'paid',
      ...(receiptId ? { fiscalReceipt: receiptId } : {}),
    },
    overrideAccess: true,
  })

  if (order.promoCode) {
    const promoId = typeof order.promoCode === 'object' ? order.promoCode.id : order.promoCode
    const promo = await payload.findByID({ collection: 'promo-codes', id: promoId, overrideAccess: true })
    await payload.update({
      collection: 'promo-codes',
      id: promoId,
      data: { usedCount: (promo.usedCount ?? 0) + 1 },
      overrideAccess: true,
    })
  }

  // Покупка в кабінеті Meta. Подія йде з сервера, тому не залежить від того,
  // чи повернувся покупець на сайт після оплати і чи стоїть у нього
  // блокувальник реклами. Дублікат із браузером Meta склеїть за номером
  // замовлення. `fulfillOrder` захищений `accessGranted`, тож подія одна.
  await sendPurchase({
    orderNumber: order.orderNumber,
    email: order.customerEmail,
    phone: order.customerPhone,
    name: order.customerName,
    total: order.total,
    items: (order.items ?? []).map((item) => ({
      id: String(
        item.kind === 'course'
          ? (typeof item.course === 'object' ? item.course?.id : item.course)
          : (typeof item.product === 'object' ? item.product?.id : item.product),
      ),
      quantity: item.quantity,
      price: item.price,
    })),
    fbp: order.metaFbp ?? undefined,
    fbc: order.metaFbc ?? undefined,
  })

  const summary = (order.items ?? [])
    .map((item) => `• ${item.title}${item.variantLabel ? ` (${item.variantLabel})` : ''} × ${item.quantity}`)
    .join('\n')

  const alarm = undelivered.length
    ? `\n\n⚠️ <b>Доступ НЕ видано:</b>\n${undelivered.map((title) => `• ${title}`).join('\n')}\n` +
      'Перевірте, чи бот адміністратор каналу з правом запрошувати через посилання. ' +
      'Покупцеві надішліть доступ вручну.'
    : ''

  await notifyAdmin(
    `<b>Оплачено ${order.orderNumber}</b>\n${summary}\n\n${formatPrice(order.total)}\n${order.customerName}, ${order.customerPhone}${alarm}`,
  )

  /*
    Те саме на пошту — але лише якщо клієнтка вписала адресу для сповіщень.
    Telegram бачать не всі й не завжди: звук буває вимкнений, а замовлення
    треба зібрати сьогодні. Порожнє поле означає «досить Telegram».
  */
  const settings = await payload.findGlobal({ slug: 'settings', depth: 0 }).catch(() => null)
  const notifyTo = settings?.orderNotifyEmail
  if (notifyTo) {
    await payload
      .sendEmail({
        to: notifyTo,
        subject: `Оплачено ${order.orderNumber} — ${formatPrice(order.total)}`,
        text: [
          `Замовлення ${order.orderNumber} оплачено.`,
          '',
          summary,
          '',
          `${formatPrice(order.total)}`,
          `${order.customerName}, ${order.customerPhone}`,
          order.customerEmail,
          undelivered.length ? `\nУВАГА: доступ не видано — ${undelivered.join(', ')}` : '',
        ]
          .filter(Boolean)
          .join('\n'),
      })
      .catch((error: unknown) => payload.logger.error({ err: error }, 'Лист власниці не пішов'))
  }

  await payload
    .sendEmail({
      to: order.customerEmail,
      subject: `Замовлення ${order.orderNumber} оплачено`,
      text: [
        `Дякуємо! Замовлення ${order.orderNumber} оплачено.`,
        '',
        summary,
        '',
        invites.length ? 'Доступ до курсів:' : '',
        ...invites,
        '',
        invites.length ? 'Посилання персональні — не пересилайте їх іншим.' : '',
        // Краще чесно сказати про затримку, ніж лишити покупця гадати, чому
        // в листі немає курсу, за який він щойно заплатив.
        undelivered.length
          ? `Доступ до «${undelivered.join('», «')}» надішлемо окремо найближчим часом — вибачте за затримку.`
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
    })
    .catch((error: unknown) => console.error('Лист про замовлення не пішов', error))
}
