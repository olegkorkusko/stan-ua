import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { fulfillOrder } from '@/lib/orders'
import { buildCallbackResponse, verifyCallback, type CallbackPayload } from '@/lib/wayforpay'

/**
 * WayForPay стукає сюди після оплати. Тіло приходить або як JSON, або як
 * єдине поле форми з JSON усередині — обробляємо обидва випадки.
 */
const readPayload = async (request: Request): Promise<CallbackPayload | null> => {
  const raw = await request.text()
  if (!raw) return null

  try {
    return JSON.parse(raw) as CallbackPayload
  } catch {
    const params = new URLSearchParams(raw)
    for (const [key, value] of params) {
      try {
        return JSON.parse(key || value) as CallbackPayload
      } catch {
        continue
      }
    }
    return null
  }
}

export const POST = async (request: Request) => {
  const payload = await getPayload({ config })
  const data = await readPayload(request)

  if (!data?.orderReference) {
    return NextResponse.json({ error: 'Порожній колбек' }, { status: 400 })
  }

  if (!verifyCallback(data)) {
    payload.logger.warn({ orderReference: data.orderReference }, 'Колбек WayForPay із хибним підписом')
    return NextResponse.json({ error: 'Підпис не збігається' }, { status: 403 })
  }

  const found = await payload.find({
    collection: 'orders',
    where: { orderNumber: { equals: data.orderReference } },
    limit: 1,
    overrideAccess: true,
  })
  const order = found.docs[0]

  if (!order) {
    payload.logger.warn({ orderReference: data.orderReference }, 'Колбек на неіснуюче замовлення')
    return NextResponse.json(buildCallbackResponse(data.orderReference))
  }

  if (data.transactionStatus === 'Approved') {
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { paymentReference: String(data.authCode ?? '') },
      overrideAccess: true,
    })
    await fulfillOrder(payload, order.id)
  } else if (['Declined', 'Expired', 'Refunded'].includes(data.transactionStatus)) {
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { paymentStatus: data.transactionStatus === 'Refunded' ? 'refunded' : 'cancelled' },
      overrideAccess: true,
    })
  }

  // Відповідь має бути підписана, інакше WayForPay повторюватиме колбек.
  return NextResponse.json(buildCallbackResponse(data.orderReference))
}
