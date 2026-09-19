import config from '@payload-config'
import { headers as nextHeaders } from 'next/headers'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'

import { hasCourseAccess } from '@/lib/access'
import { createCourseInvite } from '@/lib/telegram'

/**
 * Повторна видача доступу: покупець сам перевипускає запрошення, якщо старе
 * протермінувалось або він його загубив. Без звернення до власниці.
 */
export const POST = async (request: Request) => {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await nextHeaders() })

  if (!user || user.collection !== 'customers') {
    return NextResponse.json({ error: 'Спершу увійдіть' }, { status: 401 })
  }

  const { courseId } = (await request.json()) as { courseId?: number | string }
  if (!courseId) return NextResponse.json({ error: 'Не вказано курс' }, { status: 400 })

  const customer = await payload.findByID({ collection: 'customers', id: user.id, depth: 0, overrideAccess: true })
  if (!hasCourseAccess(customer, courseId)) {
    return NextResponse.json({ error: 'Цього курсу немає у ваших доступах' }, { status: 403 })
  }

  const records = customer.access ?? []

  const course = await payload.findByID({ collection: 'courses', id: courseId, depth: 0 })

  let link: string | null = null
  if (['telegram', 'both'].includes(course.accessType) && course.telegramChatId) {
    link = await createCourseInvite(course.telegramChatId, course.title)
  }
  if (!link && course.canvaUrl) link = course.canvaUrl

  if (!link) {
    return NextResponse.json(
      { error: 'Не вдалось випустити посилання. Напишіть нам — видамо вручну.' },
      { status: 502 },
    )
  }

  await payload.update({
    collection: 'customers',
    id: user.id,
    overrideAccess: true,
    data: {
      access: records.map((record) => {
        const id = typeof record.course === 'object' ? record.course?.id : record.course
        return String(id) === String(courseId) ? { ...record, telegramInviteLink: link } : record
      }),
    },
  })

  return NextResponse.json({ link })
}
