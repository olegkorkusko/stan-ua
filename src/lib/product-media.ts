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

type WithMedia = Pick<Product, 'images' | 'variants' | 'title'>

/**
 * Слайдер на сторінці товару: кадри в порядку «Фотографій», плюс покажчик
 * «адреса файлу → колір» для перемотування.
 *
 * Покажчик збирається з варіацій: там поле «Фото кольору». Розмір навмисно
 * не враховується — варіація це колір І розмір, той самий колір повторюється
 * в кожному розмірі, і вимагати фото в кожному рядку означало б змушувати
 * вписувати одне й те саме втричі. Виграє перший непорожній рядок кольору.
 */
export const productGallery = (product: WithMedia) => {
  const items: MediaItem[] = []
  for (const file of Array.isArray(product.images) ? product.images : []) {
    const item = toItem(file, product.title)
    if (item && !items.some((existing) => existing.src === item.src)) items.push(item)
  }

  const colorOf: Record<string, string> = {}
  for (const variant of product.variants ?? []) {
    const color = typeof variant.color === 'object' ? variant.color : null
    if (!color || !variant.image) continue
    const item = toItem(variant.image, product.title)
    if (!item) continue
    /*
      Кадр, якого немає в списку, все одно показуємо — дописуємо в кінець.
      Інакше свотч мовчки нікуди б не вів, а чому — з адмінки не видно.
    */
    if (!items.some((existing) => existing.src === item.src)) items.push(item)
    colorOf[item.src] ??= String(color.id)
  }

  return { items, colorOf }
}

/**
 * Картка в каталозі. Поля з вкладки «Картка», а коли їх не заповнили —
 * перші кадри слайдера: так товар, доданий нашвидкуруч, усе одно виглядає
 * як товар, а не як порожній прямокутник.
 */
export const productCard = (product: WithMedia & Pick<Product, 'cardImage' | 'cardHover' | 'cardVideo'>) => {
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
  product: WithMedia & Pick<Product, 'cardImage'>,
): string | undefined =>
  imageUrl(product.cardImage, 'thumbnail') ??
  productGallery(product).items.find((item) => item.kind === 'image')?.src ??
  undefined
