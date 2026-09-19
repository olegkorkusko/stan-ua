import { headers as nextHeaders } from 'next/headers'

import { payloadClient } from '@/lib/payload'
import type { Customer } from '@/payload-types'

/*
  Чи має покупець доступ до курсу.

  Перевірка однакова у двох місцях: на сторінці курсу (чи показувати посилання
  на проєкти Canva) і в повторній видачі доступу (чи має право перевипустити
  запрошення). Друга копія неминуче розійшлася б із першою — а розходження
  саме тут означає або зайвий доступ, або втрачений.

  Записи `access` зберігають курс то об'єктом, то самим числом — залежно від
  глибини, з якою читали покупця. Тому порівнюємо рядками.
*/
export const hasCourseAccess = (
  customer: Pick<Customer, 'access'>,
  courseId: number | string,
): boolean =>
  (customer.access ?? []).some((record) => {
    const id = typeof record.course === 'object' ? record.course?.id : record.course
    return String(id) === String(courseId)
  })

/**
 * Те саме для того, хто зараз дивиться сторінку. Гість — завжди `false`.
 *
 * Помилку читання сесії теж трактуємо як «доступу немає»: тут це єдиний
 * безпечний бік. Сторінка курсу від цього не ламається — вона просто
 * показує програму без посилань, як незнайомцю.
 */
export const viewerOwnsCourse = async (courseId: number | string): Promise<boolean> => {
  const payload = await payloadClient()

  try {
    const { user } = await payload.auth({ headers: await nextHeaders() })
    if (user?.collection !== 'customers') return false

    const customer = await payload.findByID({
      collection: 'customers',
      id: user.id,
      depth: 0,
      overrideAccess: true,
    })

    return hasCourseAccess(customer, courseId)
  } catch {
    return false
  }
}
