import type { Media } from '@/payload-types'

type MediaLike = number | string | Media | null | undefined

/**
 * Адреса файлу або null, якщо фото немає. Заглушку тут не підставляємо: що
 * малювати замість фото, знає <Picture> — див. components/site/Picture.tsx.
 *
 * Адреса лишається відносною (/api/media/file/...). Абсолютну next/image
 * вважає зовнішнім ресурсом і без дозволу в remotePatterns не оптимізує —
 * саме тому в payload.config.ts немає serverURL.
 */
export const imageUrl = (media: MediaLike, size?: 'thumbnail' | 'card' | 'wide' | 'hero'): string | null => {
  if (!media || typeof media === 'number' || typeof media === 'string') return null
  if (size && media.sizes?.[size]?.url) return media.sizes[size].url
  return media.url ?? null
}

/**
 * Фото це чи відео. Медіатека приймає і те, і те, а слайдер мусить знати, що
 * саме малювати: <img> на відео дасть порожній кадр, а <video> на фото —
 * чорний прямокутник із кнопкою, яка нічого не вмикає.
 */
export const isVideo = (media: MediaLike): boolean =>
  Boolean(media && typeof media === 'object' && media.mimeType?.startsWith('video/'))

export const imageAlt = (media: MediaLike, fallback: string): string => {
  if (!media || typeof media === 'number' || typeof media === 'string') return fallback
  return media.alt || fallback
}
