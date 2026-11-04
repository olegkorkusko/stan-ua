import { headers } from 'next/headers'

import { getLocale } from '@/lib/locale'
import { moneyFor } from '@/lib/price'
import { type Region } from '@/lib/region'
import { siteSettings } from '@/lib/settings'

/*
  Серверна половина регіону — окремим файлом навмисно.

  Поруч із нею живуть next/headers і запит до Payload, а тип Region потрібен і
  клієнтським компонентам. Поки все лежало в одному файлі, імпорт з клієнта
  тягнув за собою next/headers та payload, і збірка падала: «This API is only
  available in Server Components» плюс ненайдений child_process.

  Тому чистий тип — у region.ts, серверне — тут.
*/

/**
 * Регіон, валюта показу й мова — одним викликом, для серверних компонентів.
 *
 * Картки товарів і курсів малюються десятками на сторінці, і кожній потрібні
 * ті самі три значення. Налаштування за ними не ходять щоразу: siteSettings
 * обгорнутий у cache(), тож запит до бази в межах одного рендера один.
 */
export const getPricing = async () => {
  const locale = await getLocale()
  const [region, settings] = await Promise.all([getRegion(), siteSettings(locale)])
  return { locale, region, money: moneyFor(locale, settings) }
}

/** Регіон поточного запиту — за країною відвідувача. */
export const getRegion = async (): Promise<Region> => {
  // Заголовка немає ні локально, ні поза Vercel — тоді вважаємо, що Україна.
  const country = (await headers()).get('x-vercel-ip-country')
  if (!country) return 'ua'
  return country.toUpperCase() === 'UA' ? 'ua' : 'intl'
}
