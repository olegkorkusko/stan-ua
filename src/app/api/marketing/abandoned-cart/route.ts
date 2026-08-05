import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { formatPrice } from '@/lib/format'

/**
 * Лист про кинутий кошик. Викликається за розкладом (Vercel Cron або будь-який
 * планувальник) і бере кошики, які пролежали більш ніж добу й мають адресу.
 *
 * Захищено спільним секретом: інакше будь-хто міг би розсилати листи від імені
 * бренду, просто смикаючи цей маршрут.
 */
const AFTER_HOURS = 24

export const GET = async (request: Request) => {
  const secret = process.env.CRON_SECRET
  const provided =
    request.headers.get('authorization')?.replace('Bearer ', '') ??
    new URL(request.url).searchParams.get('secret')

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Немає доступу' }, { status: 401 })
  }

  const payload = await getPayload({ config })
  const cutoff = new Date(Date.now() - AFTER_HOURS * 60 * 60 * 1000).toISOString()

  const carts = await payload.find({
    collection: 'carts',
    where: {
      updatedAt: { less_than: cutoff },
      reminderSentAt: { exists: false },
    },
    limit: 100,
    depth: 1,
    overrideAccess: true,
  })

  const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
  let sent = 0

  for (const cart of carts.docs) {
    const items = cart.items ?? []
    if (items.length === 0) continue

    const customer = typeof cart.customer === 'object' ? cart.customer : null
    const email = cart.email ?? customer?.email
    if (!email) continue

    // Назви й ціни беремо з бази: у кошику зберігаються лише ідентифікатори.
    const lines: string[] = []
    let total = 0

    for (const item of items) {
      const collection = item.kind === 'course' ? 'courses' : 'products'
      const doc = await payload
        .findByID({ collection, id: item.itemId, depth: 0 })
        .catch(() => null)
      if (!doc) continue

      const price = 'priceFrom' in doc ? (doc.priceFrom ?? doc.price) : doc.price
      total += price * item.quantity
      lines.push(`• ${doc.title}${item.quantity > 1 ? ` × ${item.quantity}` : ''} — ${formatPrice(price)}`)
    }

    if (lines.length === 0) continue

    await payload
      .sendEmail({
        to: email,
        subject: 'Ви щось лишили в кошику',
        text: [
          'Вітаємо!',
          '',
          'У вашому кошику лишилось:',
          ...lines,
          '',
          `Разом: ${formatPrice(total)}`,
          '',
          `Повернутись до замовлення: ${base}/checkout`,
          '',
          'Якщо передумали — просто проігноруйте цей лист.',
        ].join('\n'),
      })
      .catch((error: unknown) => payload.logger.error({ err: error }, 'Лист про кошик не пішов'))

    await payload.update({
      collection: 'carts',
      id: cart.id,
      data: { reminderSentAt: new Date().toISOString() },
      overrideAccess: true,
    })
    sent += 1
  }

  return NextResponse.json({ checked: carts.docs.length, sent })
}
