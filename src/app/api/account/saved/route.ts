import config from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

type Body = {
  courseId?: number | string
  productId?: number | string
}

/**
 * Обране: додати або прибрати курс чи товар зі списку збережених.
 *
 * Один роут на дві колекції навмисно — логіка тут однакова до знака, різняться
 * лише поле покупця й колекція, у якій перевіряємо існування.
 */
export const POST = async (request: Request) => {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })

  if (!user || user.collection !== 'customers') {
    return NextResponse.json({ error: 'Спершу увійдіть' }, { status: 401 })
  }

  const body = (await request.json()) as Body
  const raw = body.courseId ?? body.productId
  if (!raw) return NextResponse.json({ error: 'Не вказано, що зберігати' }, { status: 400 })

  const target = Number(raw)
  if (!Number.isInteger(target)) {
    return NextResponse.json({ error: 'Не вказано, що зберігати' }, { status: 400 })
  }

  const collection = body.courseId ? ('courses' as const) : ('products' as const)
  const field = body.courseId ? ('savedCourses' as const) : ('savedProducts' as const)

  // Без цієї перевірки payload.update падає на неіснуючому звʼязку, і роут
  // віддає 500 з порожнім тілом — клієнт тоді не може відрізнити «немає
  // такого» від «сервер зламався» й мовчки відкочує серце.
  const exists = await payload
    .findByID({ collection, id: target, depth: 0, overrideAccess: true })
    .catch(() => null)
  if (!exists) return NextResponse.json({ error: 'Не знайдено' }, { status: 404 })

  const customer = await payload.findByID({
    collection: 'customers',
    id: user.id,
    depth: 0,
    overrideAccess: true,
  })

  const current = (customer[field] ?? []).map((item) =>
    typeof item === 'object' ? item.id : item,
  )
  const saved = current.includes(target)

  await payload.update({
    collection: 'customers',
    id: user.id,
    overrideAccess: true,
    data: {
      [field]: saved ? current.filter((id) => id !== target) : [...current, target],
    },
  })

  return NextResponse.json({ saved: !saved })
}
