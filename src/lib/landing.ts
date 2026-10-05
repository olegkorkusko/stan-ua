import { cache } from 'react'

import type { Locale } from '@/lib/i18n'
import { imageUrl } from '@/lib/media'
import { payloadClient } from '@/lib/payload'

/*
  Тексти лендингів приходять із двох місць: код (lib/i18n.ts) і адмінка
  (глобали «Сторінка "Магазин"» / «Сторінка "Навчання"»). Тут вони зводяться.

  Правило одне: непорожнє значення з адмінки перемагає, решта лишається з коду.
  Не «або те, або те» цілим блоком, а поле за полем — інакше клієнтка,
  заповнивши лише заголовок, обнулила б собі опис і кнопку.

  Так само це рятує при кожному новому полі: поки в базі його немає, сторінка
  бере текст із коду й нічого не ламається.
*/

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const overlay = <T>(fallback: T, override: unknown): T => {
  if (typeof fallback === 'string') {
    const filled = typeof override === 'string' && override.trim().length > 0
    return (filled ? override : fallback) as T
  }

  if (Array.isArray(fallback)) {
    if (!Array.isArray(override) || override.length === 0) return fallback
    /*
      Кількість рядків задає адмінка: додала четвертий крок — він з'явиться.
      За зразок для зайвих беремо останній елемент з коду, щоб у нового рядка
      були всі поля, а не порожнеча.
    */
    const template = fallback[fallback.length - 1]
    return override.map((item, index) => overlay(fallback[index] ?? template, item)) as T
  }

  if (isPlainObject(fallback)) {
    if (!isPlainObject(override)) return fallback
    const merged: Record<string, unknown> = { ...fallback }
    for (const key of Object.keys(fallback)) {
      merged[key] = overlay((fallback as Record<string, unknown>)[key], override[key])
    }
    return merged as T
  }

  return fallback
}

/**
 * Тексти лендинга: з адмінки поверх коду.
 *
 * Помилку читання глобала ковтаємо навмисно — сторінка магазину не має падати
 * через те, що база відповіла не одразу. У найгіршому разі відвідувач побачить
 * тексти з коду й не помітить різниці.
 */
type LandingSlug = 'shop-page' | 'courses-page'

/*
  Сам запис із бази. cache() — бо сторінка питає його двічі: раз по тексти,
  раз по банер. Без нього це два однакові запити на кожен рендер.

  fallbackLocale: false — інакше англійська версія показує українські тексти.
  У конфізі стоїть fallback: true, тож порожнє англійське поле Payload
  підміняє українським. Тут це шкодить: у словнику лежить готовий переклад,
  а підставлена українська його перекривала — на /en блок «Доставка й оплата»
  виходив українською посеред англійської сторінки.

  Порожнє поле має лишатися порожнім: тоді overlay віддасть переклад із коду,
  а коли клієнтка впише англійський текст — переможе він.

  depth: 1 — щоб банер прийшов документом, а не самим лише числом.

  Помилку читання ковтаємо навмисно: сторінка не має падати через те, що база
  відповіла не одразу. У найгіршому разі відвідувач побачить тексти з коду.
*/
const landingGlobal = cache(async (slug: LandingSlug, locale: Locale) => {
  const payload = await payloadClient()
  return payload.findGlobal({ slug, locale, fallbackLocale: false, depth: 1 }).catch(() => null)
})

/** Тексти лендинга: з адмінки поверх коду. */
export const landingCopy = async <T>(
  slug: LandingSlug,
  locale: Locale,
  fallback: T,
): Promise<T> => overlay(fallback, await landingGlobal(slug, locale))

/**
 * Банер першого екрана. Словник його не описує — overlay вище ходить лише по
 * ключах, які є в коді, тож завантажене фото крізь нього не проходить. Тому
 * окрема функція, а не ще одне поле в текстах.
 *
 * Порожньо в обох — сторінка підставить файл із public.
 */
export const landingBanner = async (slug: LandingSlug, locale: Locale) => {
  const stored = (await landingGlobal(slug, locale)) as {
    hero?: { image?: unknown; video?: unknown }
  } | null

  return {
    image: imageUrl(stored?.hero?.image as never, 'hero'),
    // У відео розмірів не буває — imageUrl віддасть адресу самого файлу.
    video: imageUrl(stored?.hero?.video as never),
  }
}
