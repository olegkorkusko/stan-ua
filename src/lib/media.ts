import type { Media } from '@/payload-types'

type MediaLike = number | string | Media | null | undefined

/**
 * Поки клієнтка не завантажила фото, компоненти показують «переплетення»
 * замість сірого прямокутника. Тому тут повертається null, а не заглушка.
 */
export const imageUrl = (media: MediaLike, size?: 'thumbnail' | 'card' | 'wide' | 'hero'): string | null => {
  if (!media || typeof media === 'number' || typeof media === 'string') return null
  if (size && media.sizes?.[size]?.url) return media.sizes[size].url
  return media.url ?? null
}

export const imageAlt = (media: MediaLike, fallback: string): string => {
  if (!media || typeof media === 'number' || typeof media === 'string') return fallback
  return media.alt || fallback
}
