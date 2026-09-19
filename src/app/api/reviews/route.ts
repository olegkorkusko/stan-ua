import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { notifyAdmin } from '@/lib/telegram'

type Body = {
  authorName?: string
  city?: string
  text?: string
  rating?: number
  product?: number
  course?: number
}

/** Відгук завжди лягає на модерацію: на сайті він зʼявиться після схвалення. */
export const POST = async (request: Request) => {
  const payload = await getPayload({ config })
  const body = (await request.json()) as Body

  const authorName = body.authorName?.trim() ?? ''
  const text = body.text?.trim() ?? ''
  const rating = Number(body.rating)

  if (authorName.length < 2) return NextResponse.json({ error: "Вкажіть імʼя" }, { status: 400 })
  if (text.length < 10) return NextResponse.json({ error: 'Напишіть трохи докладніше' }, { status: 400 })
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Оцінка має бути від 1 до 5' }, { status: 400 })
  }
  if (!body.product && !body.course) {
    return NextResponse.json({ error: 'Невідомо, про що відгук' }, { status: 400 })
  }

  await payload.create({
    collection: 'reviews',
    overrideAccess: true,
    data: {
      authorName: authorName.slice(0, 80),
      // Місто не обовʼязкове: у підписі «ОКСАНА · КИЇВ» воно просто зникає,
      // якщо його не вказали.
      city: body.city?.trim().slice(0, 60) || undefined,
      text: text.slice(0, 2000),
      rating,
      product: body.product,
      course: body.course,
      status: 'pending',
    },
  })

  await notifyAdmin(`<b>Новий відгук на модерації</b>\n${authorName}: ${text.slice(0, 200)}`)

  return NextResponse.json({ ok: true })
}
