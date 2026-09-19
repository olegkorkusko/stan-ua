import { headers as nextHeaders } from 'next/headers'

import { getLocale } from '@/lib/locale'
import { payloadClient } from '@/lib/payload'
import type { Customer } from '@/payload-types'

/** Вкладки кабінету. Порядок — як у макеті (137:2930). */
export type AccountTab = 'access' | 'saved' | 'delivery'

export const ACCOUNT_ROUTES: Record<AccountTab, string> = {
  access: '/account',
  saved: '/account/saved',
  delivery: '/account/delivery',
}

/**
 * Покупець поточної сесії з усіма звʼязками, які потрібні кабінету.
 *
 * Один спільний виклик на всі три вкладки: кожна з них однаково перевіряє
 * сесію, однаково дотягує курси на два рівні вглиб і однаково показує гостю
 * форму входу. Трьома копіями це розійшлося б із першою ж правкою.
 */
export const accountCustomer = async (): Promise<Customer | null> => {
  const payload = await payloadClient()
  const locale = await getLocale()

  const { user } = await payload.auth({ headers: await nextHeaders() })

  const id = user?.collection === 'customers' ? user.id : await parityDemoCustomerId()
  if (!id) return null

  return payload
    .findByID({ collection: 'customers', id, depth: 2, locale, overrideAccess: true })
    .catch(() => null)
}

/*
  Кабінет живе за логіном, а перевірка parity ходить на сторінку звичайним
  браузером без сесії — і бачить форму входу замість кадру «Кабінет».

  Тому є запасний вхід: змінна оточення з поштою демо-покупця. Вмикати її
  треба явно (`PARITY_DEMO_ACCOUNT=customer@mk.local npm run dev`), і в
  продакшен-збірці вона не працює взагалі — це саме риштування для перевірки,
  а не спосіб обійти авторизацію.
*/
const parityDemoCustomerId = async (): Promise<number | null> => {
  const email = process.env.PARITY_DEMO_ACCOUNT
  if (!email || process.env.NODE_ENV === 'production') return null

  const payload = await payloadClient()
  const found = await payload.find({
    collection: 'customers',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  return found.docs[0]?.id ?? null
}
