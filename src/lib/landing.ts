import type { Locale } from '@/lib/i18n'
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
export const landingCopy = async <T>(
  slug: 'shop-page' | 'courses-page',
  locale: Locale,
  fallback: T,
): Promise<T> => {
  const payload = await payloadClient()
  const stored = await payload.findGlobal({ slug, locale, depth: 0 }).catch(() => null)
  return overlay(fallback, stored)
}
