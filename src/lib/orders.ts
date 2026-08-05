import crypto from 'crypto'
import type { Payload } from 'payload'

import { createReceipt } from '@/lib/checkbox'
import { formatPrice } from '@/lib/format'
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
 */
export const decrementStock = async (
  payload: Payload,
  productId: number | string,
  variantId: string | null,
  quantity: number,
): Promise<void> => {
  const db = payload.db as unknown as {
    drizzle?: { execute: (query: unknown) => Promise<unknown> }
    beginTransaction?: () => Promise<string | number | null>
    commitTransaction?: (id: string | number) => Promise<void>
    rollbackTransaction?: (id: string | number) => Promise<void>
  }

  const transactionID = (await db.beginTransaction?.()) ?? null

  try {
    const req = transactionID ? ({ transactionID } as never) : undefined

    const product = await payload.findByID({
      collection: 'products',
      id: productId,
      depth: 0,
      req,
    })

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
export const fulfillOrder = async (payload: Payload, orderId: number | string): Promise<void> => {
  const order = await payload.findByID({ collection: 'orders', id: orderId, depth: 1, overrideAccess: true })
  if (order.accessGranted) return

  const invites: string[] = []
  const grants: { course: number; relatedOrder: number; grantedAt: string; telegramInviteLink?: string }[] = []

  for (const item of order.items ?? []) {
    if (item.kind === 'course') {
      const courseId = typeof item.course === 'object' ? item.course?.id : item.course
      if (!courseId) continue
      const course = await payload.findByID({ collection: 'courses', id: courseId, depth: 0 })
      let inviteLink: string | undefined

      if (['telegram', 'both'].includes(course.accessType) && course.telegramChatId) {
        const link = await createCourseInvite(course.telegramChatId, course.title)
        if (link) {
          inviteLink = link
          invites.push(`${course.title}: ${link}`)
        }
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

  // Доступи чіпляємо до облікового запису за поштою: покупець побачить їх
  // у кабінеті й зможе відкрити повторно, навіть якщо загубив листа.
  if (grants.length > 0) {
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
      data: { access: [...(customer.access ?? []), ...grants] },
    })

    await payload.update({
      collection: 'orders',
      id: orderId,
      data: { customer: customer.id },
      overrideAccess: true,
    })
  }

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

  const summary = (order.items ?? [])
    .map((item) => `• ${item.title}${item.variantLabel ? ` (${item.variantLabel})` : ''} × ${item.quantity}`)
    .join('\n')

  await notifyAdmin(
    `<b>Оплачено ${order.orderNumber}</b>\n${summary}\n\n${formatPrice(order.total)}\n${order.customerName}, ${order.customerPhone}`,
  )

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
        'Посилання персональні — не пересилайте їх іншим.',
      ]
        .filter(Boolean)
        .join('\n'),
    })
    .catch((error: unknown) => console.error('Лист про замовлення не пішов', error))
}
