import { imageAlt, imageUrl, isVideo } from '@/lib/media'
import type { Product } from '@/payload-types'

/*
  Фото товару в одному місці.

  Раніше кожна сторінка розбирала `product.images` сама й по-своєму
  домовлялася, що перший файл — це картка, а другий — наведення. Домовленість
  жила в чотирьох файлах і ніде не була записана. Тепер поля справжні
  («Обкладинка картки», «Фото при наведенні»), а тут — одне місце, яке знає,
  що робити, коли їх не заповнили.
*/

export type MediaItem = { src: string; alt: string; kind: 'image' | 'video' }

const toItem = (file: unknown, fallbackAlt: string): MediaItem | null => {
  const video = isVideo(file as never)
  // У відео розмірів не буває — беремо адресу самого файлу.
  const src = video ? imageUrl(file as never) : imageUrl(file as never, 'wide')
  if (!src) return null
  return { src, alt: imageAlt(file as never, fallbackAlt), kind: video ? 'video' : 'image' }
}

/**
 * Слайдер на сторінці товару: кадри в порядку груп із «Фото й відео за
 * кольором», плюс покажчик «адреса файлу → колір» для перемотування.
 */
export const productGallery = (product: Pick<Product, 'colorGallery' | 'title'>) => {
  const items: MediaItem[] = []
  const colorOf: Record<string, string> = {}

  for (const row of product.colorGallery ?? []) {
    const color = typeof row.color === 'object' ? row.color : null
    for (const file of Array.isArray(row.media) ? row.media : []) {
      const item = toItem(file, product.title)
      if (!item) continue
      if (!items.some((existing) => existing.src === item.src)) items.push(item)
      if (color) colorOf[item.src] ??= String(color.id)
    }
  }

  return { items, colorOf }
}

/**
 * Картка в каталозі. Поля з вкладки «Картка», а коли їх не заповнили —
 * перші кадри слайдера: так товар, доданий нашвидкуруч, усе одно виглядає
 * як товар, а не як порожній прямокутник.
 */
export const productCard = (
  product: Pick<Product, 'colorGallery' | 'title' | 'cardImage' | 'cardHover' | 'cardVideo'>,
) => {
  const photos = productGallery(product).items.filter((item) => item.kind === 'image')

  return {
    cover: imageUrl(product.cardImage, 'card') ?? photos[0]?.src ?? null,
    coverAlt: product.cardImage ? imageAlt(product.cardImage, product.title) : (photos[0]?.alt ?? product.title),
    hover: imageUrl(product.cardHover, 'card') ?? photos[1]?.src ?? null,
    video: imageUrl(product.cardVideo),
  }
}

/** Мініатюра для кошика й списків — те саме, що на картці, тільки дрібне. */
export const productThumb = (
  product: Pick<Product, 'colorGallery' | 'title' | 'cardImage' | 'cardHover' | 'cardVideo'>,
): string | undefined =>
  imageUrl(product.cardImage, 'thumbnail') ??
  productGallery(product).items.find((item) => item.kind === 'image')?.src ??
  undefined
