import { cookies, headers } from 'next/headers'

import { getLocale } from '@/lib/locale'
import { moneyFor } from '@/lib/price'
import { isRegion, REGION_COOKIE, type Region } from '@/lib/region'
import { siteSettings } from '@/lib/settings'

/*
  Серверна половина регіону — окремим файлом навмисно.

  Поруч із нею живуть next/headers і запит до Payload. Перемикач регіону —
  компонент клієнтський, і йому потрібні лише назва cookie й тип. Поки все
  лежало в одному файлі, імпорт з клієнта тягнув за собою next/headers та
  payload, і збірка падала: «This API is only available in Server Components»
  плюс ненайдений child_process.

  Тому чисте (тип, назва cookie, isRegion) — у region.ts, серверне — тут.
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

/** Регіон поточного запиту: вибір покупця, інакше підказка за IP. */
export const getRegion = async (): Promise<Region> => {
  const chosen = (await cookies()).get(REGION_COOKIE)?.value
  if (isRegion(chosen)) return chosen

  // Заголовка немає ні локально, ні поза Vercel — тоді вважаємо, що Україна.
  const country = (await headers()).get('x-vercel-ip-country')
  if (!country) return 'ua'
  return country.toUpperCase() === 'UA' ? 'ua' : 'intl'
}
