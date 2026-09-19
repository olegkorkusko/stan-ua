import config from '@payload-config'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

type Body = { email?: string; password?: string; name?: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8

/**
 * Реєстрація покупця (пункт 7.1 обсягу робіт).
 *
 * До цього обліковий запис міг зʼявитися ЛИШЕ як побічний ефект покупки курсу
 * (`fulfillOrder` створює його з випадковим паролем). Хто купував тільки
 * товари, не мав кабінету взагалі — а отже ні обраного, ні даних для доставки.
 *
 * Роут тільки створює запис. Сесію відкриває клієнт, одразу викликаючи
 * штатний `/api/customers/login`: кукі там ставить сам Payload, і повторювати
 * цю логіку руками — зайвий ризик розійтися з нею при оновленні.
 */
export const POST = async (request: Request) => {
  const payload = await getPayload({ config })
  const body = (await request.json()) as Body

  const email = body.email?.trim().toLowerCase() ?? ''
  const password = body.password ?? ''
  const name = body.name?.trim() ?? ''

  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: 'Перевірте адресу пошти' }, { status: 400 })
  }
  if (password.length < MIN_PASSWORD) {
    return NextResponse.json(
      { error: `Пароль має бути щонайменше ${MIN_PASSWORD} символів` },
      { status: 400 },
    )
  }

  const existing = await payload.find({
    collection: 'customers',
    where: { email: { equals: email } },
    limit: 1,
    overrideAccess: true,
  })

  if (existing.totalDocs > 0) {
    /*
      Тут ми свідомо кажемо, що пошта зайнята, хоча форма входу за посиланням
      навпаки відповідає однаково завжди. Різниця навмисна: там нейтральна
      відповідь нічого не коштує, а в реєстрації приховати результат неможливо
      — новий користувач одразу опиняється в кабінеті, і мовчання лише збило б
      з пантелику того, хто просто забув, що акаунт у нього вже є.
    */
    return NextResponse.json(
      { error: 'Ця пошта вже зареєстрована. Увійдіть паролем або отримайте посилання на пошту.' },
      { status: 409 },
    )
  }

  await payload.create({
    collection: 'customers',
    overrideAccess: true,
    data: { email, password, name: name || undefined },
  })

  return NextResponse.json({ ok: true })
}
