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
import { asDeliveryMethod } from '@/lib/delivery'
import { formatPrice } from '@/lib/format'
import { notifyAdmin } from '@/lib/telegram'
import { buildPurchaseForm, isConfigured } from '@/lib/wayforpay'

type Body = {
  items: CartLineInput[]
  promoCode?: string
  customerName: string
  customerPhone: string
  customerEmail: string
  deliveryMethod?: string
  deliveryCity?: string
  deliveryBranch?: string
  deliveryPostcode?: string
  comment?: string
  newsletter?: boolean
  paymentMethod: 'card'
  fbp?: string
  fbc?: string
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

    // Спосіб доставки перевіряємо нарівні з містом і відділенням. Раніше його
    // просто проганяли через asDeliveryMethod уже при створенні запису, і
    // невідоме значення мовчки ставало порожнім: замовлення з'являлося в
    // адмінці з містом, відділенням і БЕЗ способу доставки — відправити його
    // неможливо, а покупець при цьому бачив «дякуємо». З форми таке не
    // приходить, але API відкритий, і мовчки втрачати спосіб доставки не
    // можна: це межа довіри, а не внутрішній виклик.
    const deliveryMethod = asDeliveryMethod(body.deliveryMethod)

    if (hasPhysical && !deliveryMethod) {
      return NextResponse.json({ error: 'Оберіть спосіб доставки' }, { status: 400 })
    }

    if (hasPhysical && (!body.deliveryCity?.trim() || !body.deliveryBranch?.trim())) {
      return NextResponse.json({ error: 'Вкажіть місто й відділення' }, { status: 400 })
    }

    // Укрпошта доставляє за індексом, а не за номером відділення: без нього
    // посилку не оформити, тож просимо одразу, а не листуванням потім.
    if (hasPhysical && deliveryMethod === 'ukrposhta' && !/^\d{5}$/.test(body.deliveryPostcode ?? '')) {
      return NextResponse.json({ error: 'Вкажіть поштовий індекс — пʼять цифр' }, { status: 400 })
    }

    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
    const { discount, promoId } = await applyPromo(payload, body.promoCode, lines)
    const total = Math.max(0, subtotal - discount)

    const settings = await payload.findGlobal({ slug: 'settings', depth: 0 })

    // Оплата лише карткою і лише повна: накладеного платежу більше немає —
    // див. PAYMENT_METHODS у lib/delivery.
    const payNow = total

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
        deliveryMethod: hasPhysical ? deliveryMethod : undefined,
        deliveryCity: body.deliveryCity,
        deliveryBranch: body.deliveryBranch,
        deliveryPostcode: deliveryMethod === 'ukrposhta' ? body.deliveryPostcode : undefined,
        comment: body.comment,
        // Згода на розсилку живе в замовленні, бо покупця ще немає: його
        // заводить fulfillOrder уже після підтвердженої оплати.
        newsletter: body.newsletter === true,
        subtotal,
        discount,
        deliveryCost: 0,
        total,
        paymentMethod: 'card',
        promoCode: promoId,
        // Приходять, лише якщо покупець дав згоду на cookie й піксель встиг
        // їх поставити. Порожні — серверна подія просто піде без них.
        metaFbp: typeof body.fbp === 'string' ? body.fbp.slice(0, 255) : undefined,
        metaFbc: typeof body.fbc === 'string' ? body.fbc.slice(0, 255) : undefined,
      },
    })

    const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

    /*
      Сповіщення до оплати.

      Обовʼязкове, коли ключів WayForPay немає: оплатити на сайті неможливо,
      рахунок виставляють вручну, і без сигналу покупець просто чекає, а про
      нього ніхто не знає.

      Коли оплата працює — за бажанням, галочкою в налаштуваннях. Типово
      вимкнено: замовлення створюється ДО переходу на оплату, тож інакше
      власниця отримувала б сигнал про кожного, хто відкрив форму й закрив
      вкладку, а таких завжди більшість.
    */
    const unpaidNotice = !isConfigured() || settings?.notifyPendingOrders === true

    if (unpaidNotice) {
      const summary = lines
        .map((line) => `• ${line.title}${line.quantity > 1 ? ` × ${line.quantity}` : ''}`)
        .join('\n')

      const text = [
        `Нове замовлення ${orderNumber} — ОЧІКУЄ ОПЛАТИ`,
        '',
        summary,
        '',
        `${formatPrice(total)}`,
        `${body.customerName.trim()}, ${body.customerPhone.trim()}`,
        body.customerEmail.trim(),
        '',
        // Порада залежить від того, чому замовлення неоплачене.
        isConfigured()
          ? 'Покупець дійшов до оплати й не заплатив. Можливо, не пройшла картка.'
          : 'Оплата на сайті не підключена — виставте рахунок вручну.',
      ].join('\n')

      await notifyAdmin(text.replace(orderNumber, `<b>${orderNumber}</b>`)).catch(() => {})

      /*
        Лист — доповнення, не заміна: у Telegram повідомлення йде завжди, а
        пошта вмикається тим, що клієнтка вписала адресу. На публічну з
        «Контактів» не падаємо навмисно — її бачать покупці, і службові листи
        там недоречні.
      */
      const notifyTo = settings?.orderNotifyEmail
      if (notifyTo) {
        await payload
          .sendEmail({ to: notifyTo, subject: `Замовлення ${orderNumber} очікує оплати`, text })
          .catch((error: unknown) => payload.logger.error({ err: error }, 'Лист про замовлення не пішов'))
      }
    }

    if (!isConfigured()) {
      // Без ключів платіжної форми немає — ведемо на сторінку подяки з
      // поясненням, що реквізити надішлють окремо.
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
