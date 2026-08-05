import config from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

/** Обране: додати або прибрати курс зі списку збережених. */
export const POST = async (request: Request) => {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })

  if (!user || user.collection !== 'customers') {
    return NextResponse.json({ error: 'Спершу увійдіть' }, { status: 401 })
  }

  const { courseId } = (await request.json()) as { courseId?: number | string }
  if (!courseId) return NextResponse.json({ error: 'Не вказано курс' }, { status: 400 })

  const customer = await payload.findByID({
    collection: 'customers',
    id: user.id,
    depth: 0,
    overrideAccess: true,
  })

  const current = (customer.savedCourses ?? []).map((item) =>
    typeof item === 'object' ? item.id : item,
  )
  const target = Number(courseId)
  const saved = current.includes(target)

  await payload.update({
    collection: 'customers',
    id: user.id,
    overrideAccess: true,
    data: {
      savedCourses: saved ? current.filter((id) => id !== target) : [...current, target],
    },
  })

  return NextResponse.json({ saved: !saved })
}
