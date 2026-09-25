import config from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { asDeliveryMethod, asPaymentMethod } from '@/lib/delivery'

type Body = {
  name?: unknown
  phone?: unknown
  deliveryMethod?: unknown
  deliveryCity?: unknown
  deliveryBranch?: unknown
  paymentMethod?: unknown
}

const text = (value: unknown, limit = 120): string =>
  typeof value === 'string' ? value.trim().slice(0, limit) : ''

/**
 * Профіль доставки з кабінету: імʼя, телефон, куди й чим.
 *
 * Пошта сюди не приймається навмисно — вона є логіном, і зміна її тут обійшла б
 * і перевірку унікальності, і повторний вхід. Маска картки теж: вона приходить
 * від платіжки, а не від браузера.
 */
export const POST = async (request: Request) => {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })

  if (!user || user.collection !== 'customers') {
    return NextResponse.json({ error: 'Спершу увійдіть' }, { status: 401 })
  }

  const body = (await request.json().catch(() => null)) as Body | null
  if (!body) return NextResponse.json({ error: 'Порожній запит' }, { status: 400 })

  const phone = text(body.phone, 32)
  if (phone && !/^\+?[\d\s()-]{9,}$/.test(phone)) {
    return NextResponse.json({ error: 'Вкажіть телефон' }, { status: 400 })
  }

  await payload.update({
    collection: 'customers',
    id: user.id,
    overrideAccess: true,
    data: {
      name: text(body.name),
      phone,
      // Порожній вибір зберігаємо як null, а не пропускаємо: покупець міг
      // свідомо прибрати спосіб доставки, і мовчки лишити старий було б брехнею.
      deliveryMethod: asDeliveryMethod(body.deliveryMethod) ?? null,
      deliveryCity: text(body.deliveryCity),
      deliveryBranch: text(body.deliveryBranch),
      paymentMethod: asPaymentMethod(body.paymentMethod) ?? null,
    },
  })

  return NextResponse.json({ ok: true })
}
