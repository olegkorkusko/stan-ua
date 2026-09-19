import { headers as nextHeaders } from 'next/headers'

import { payloadClient } from '@/lib/payload'

export type SavedState = {
  /** Чи відвідувач узагалі увійшов як покупець. */
  authorized: boolean
  /** Id курсів, які він додав в обране. */
  courses: Set<number>
  /** Id товарів, які він додав в обране. */
  products: Set<number>
}

const EMPTY: SavedState = { authorized: false, courses: new Set(), products: new Set() }

/**
 * Обране поточного відвідувача — одним запитом на сторінку, а не по запиту
 * на картку. Сторінки зі списками (каталоги, напрям, пошук, журнал) викликають
 * це один раз і роздають карткам готовий стан, щоб серце одразу малювалось
 * правильно й не блимало після гідратації.
 *
 * Для гостя повертає порожній стан — сама кнопка тоді веде в кабінет.
 */
export const savedItems = async (): Promise<SavedState> => {
  const payload = await payloadClient()

  try {
    const { user } = await payload.auth({ headers: await nextHeaders() })
    if (user?.collection !== 'customers') return EMPTY

    const customer = await payload.findByID({
      collection: 'customers',
      id: user.id,
      depth: 0,
      overrideAccess: true,
    })

    const ids = (list: typeof customer.savedCourses | typeof customer.savedProducts) =>
      new Set((list ?? []).map((item) => (typeof item === 'object' ? item.id : item)))

    return {
      authorized: true,
      courses: ids(customer.savedCourses),
      products: ids(customer.savedProducts),
    }
  } catch {
    // Обране — не критичний шлях: якщо сесію не прочитати, сторінка має
    // показатися гостьовою, а не впасти.
    return EMPTY
  }
}
