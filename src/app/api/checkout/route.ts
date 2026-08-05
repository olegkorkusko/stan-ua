import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import {
  applyPromo,
  CheckoutError,
  makeOrderNumber,
  priceCart,
  type CartLineInput,
} from '@/lib/orders'
import { buildPurchaseForm, isConfigured } from '@/lib/wayforpay'

const DELIVERY_METHODS = ['np_branch', 'np_locker', 'np_courier', 'ukrposhta'] as const
type DeliveryMethod = (typeof DELIVERY_METHODS)[number]

const asDeliveryMethod = (value: unknown): DeliveryMethod | undefined =>
  DELIVERY_METHODS.includes(value as DeliveryMethod) ? (value as DeliveryMethod) : undefined

type Body = {
  items: CartLineInput[]
  promoCode?: string
  customerName: string
  customerPhone: string
  customerEmail: string
  deliveryMethod?: string
  deliveryCity?: string
  deliveryBranch?: string
  comment?: string
  paymentMethod: 'card' | 'cod'
}

const required = (body: Body) => {
  if (!body.customerName?.trim()) return "Вкажіть ім'я"
  if (!/^\+?[\d\s()-]{9,}$/.test(body.customerPhone ?? '')) return 'Вкажіть телефон'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.customerEmail ?? '')) return 'Вкажіть пошту — на неї прийде доступ'
  return null
}

export const POST = async (request: Request) => {
  const payload = await getPayload({ config })

  try {
    const body = (await request.json()) as Body

    const validationError = required(body)
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

    const lines = await priceCart(payload, body.items)
    const hasPhysical = lines.some((line) => line.kind === 'product')

    if (hasPhysical && (!body.deliveryCity?.trim() || !body.deliveryBranch?.trim())) {
      return NextResponse.json({ error: 'Вкажіть місто й відділення' }, { status: 400 })
    }

    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
    const { discount, promoId } = await applyPromo(payload, body.promoCode, lines)
    const total = Math.max(0, subtotal - discount)

    const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })

    // Накладений платіж: онлайн береться передплата, решта — при отриманні.
    // Курси так продавати не можна — доступ видається одразу.
    const codAllowed = hasPhysical && !lines.some((line) => line.kind === 'course')
    const isCod = body.paymentMethod === 'cod' && codAllowed
    const prepaid = isCod ? Math.min(settings?.prepaymentAmount ?? 200, total) : 0
    const payNow = isCod ? prepaid : total

    const orderNumber = makeOrderNumber()

    const order = await payload.create({
      collection: 'orders',
      overrideAccess: true,
      data: {
        orderNumber,
        paymentStatus: 'pending',
        fulfillmentStatus: 'new',
        items: lines.map((line) => ({
          kind: line.kind,
          title: line.title,
          quantity: line.quantity,
          price: line.price,
          product: line.product,
          course: line.course,
          variantId: line.variantId,
          variantLabel: line.variantLabel,
        })),
        customerName: body.customerName.trim(),
        customerPhone: body.customerPhone.trim(),
        customerEmail: body.customerEmail.trim().toLowerCase(),
        deliveryMethod: hasPhysical ? asDeliveryMethod(body.deliveryMethod) : undefined,
        deliveryCity: body.deliveryCity,
        deliveryBranch: body.deliveryBranch,
        comment: body.comment,
        subtotal,
        discount,
        deliveryCost: 0,
        total,
        prepaidAmount: prepaid,
        promoCode: promoId,
      },
    })

    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

    if (!isConfigured()) {
      // Без ключів WayForPay замовлення все одно створюється — його видно
      // в адмінці, і власниця може виставити рахунок вручну.
      return NextResponse.json({
        orderNumber,
        redirect: `/checkout/thanks?order=${orderNumber}&pending=1`,
      })
    }

    const purchase = buildPurchaseForm({
      orderReference: orderNumber,
      orderDate: Math.floor(Date.now() / 1000),
      amount: payNow,
      items: lines.map((line) => ({ name: line.title, price: line.price, count: line.quantity })),
      client: {
        firstName: body.customerName.trim(),
        email: body.customerEmail.trim(),
        phone: body.customerPhone.replace(/\D/g, ''),
      },
      serviceUrl: `${base}/api/payments/wayforpay/callback`,
      returnUrl: `${base}/checkout/thanks?order=${orderNumber}`,
    })

    return NextResponse.json({ orderNumber, orderId: order.id, payment: purchase })
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    payload.logger.error({ err: error }, 'Не вдалось оформити замовлення')
    return NextResponse.json({ error: 'Щось пішло не так. Спробуйте ще раз.' }, { status: 500 })
  }
}
