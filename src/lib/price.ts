import type { Region } from '@/lib/region'

/*
  Яку з двох цін брати і в чому її показувати.

  У базі обидві ціни — у гривнях. Закордонна більша, бо в неї закладено
  пересилку: покупцеві поза Україною на сайті пишеться «безкоштовна доставка».
  Валюта тут ні до чого — вона впливає лише на те, як число намальоване.

  Порожня закордонна ціна означає «та сама, що й звичайна», а не «нуль»: інакше
  кожен новий товар доводилося б заповнювати двічі, і забуте поле продавало б
  за безцінь.
*/

type Priced = { price?: number | null; priceExport?: number | null }

/** Ціна товару, варіації чи курсу для вказаного регіону. */
export const priceFor = (item: Priced | null | undefined, region: Region): number => {
  if (!item) return 0
  if (region === 'intl' && typeof item.priceExport === 'number') return item.priceExport
  return item.price ?? 0
}

/**
 * Ціна варіації з відкотом до базової — тим самим ланцюжком для обох регіонів.
 *
 * Порядок саме такий: спершу власна ціна варіації, потім ціна товару. Якщо
 * закордонної немає ні там, ні там — продаємо за внутрішньою, і це свідомо:
 * краще продати дешевше, ніж не продати зовсім чи віддати за нуль.
 */
export const variantPrice = (
  product: Priced,
  variant: Priced | null | undefined,
  region: Region,
): number => {
  if (region === 'intl') {
    if (typeof variant?.priceExport === 'number') return variant.priceExport
    if (typeof product.priceExport === 'number') return product.priceExport
  }
  if (typeof variant?.price === 'number') return variant.price
  return product.price ?? 0
}

/**
 * Закреслена «стара» ціна — своя для кожного регіону.
 *
 * Відкоту на українську стару ціну тут НЕМАЄ навмисно, на відміну від самої
 * ціни. Старе число прив'язане до конкретної акції на конкретному ринку: курс
 * за 320 ₴ зі старою 1500 ₴ виглядає як знижка, а той самий курс за кордоном
 * за 2000 ₴ із тією ж закресленою 1500 ₴ — як подорожчання, подане знижкою.
 * Тому порожнє поле означає «за кордоном акції немає», а не «візьми українську».
 */
export const oldPriceFor = (
  item: { oldPrice?: number | null; oldPriceExport?: number | null },
  region: Region,
): number | null => {
  const value = region === 'intl' ? item.oldPriceExport : item.oldPrice
  return typeof value === 'number' && value > 0 ? value : null
}

/**
 * Ціна «від» для картки в каталозі.
 *
 * `priceFrom` і `priceFromExport` рахує хук у Products — найдешевша з варіацій.
 * Тут лише вибір між ними за регіоном, з відкотом на звичайну ціну.
 */
export const cardPrice = (
  item: { price?: number | null; priceFrom?: number | null; priceFromExport?: number | null },
  region: Region,
): number => {
  if (region === 'intl' && typeof item.priceFromExport === 'number') return item.priceFromExport
  return item.priceFrom ?? item.price ?? 0
}

/*
  Валюта показу. Null — показуємо гривні, як було.

  Зав'язана на МОВУ, а не на регіон: англійською зручніше бачити долари, але
  це лише одиниці виміру. Скільки саме спишеться — визначає регіон.
*/
export type Money = { currency: 'USD' | 'EUR'; rate: number }

type RateSettings = { exportCurrency?: string | null; exportRate?: number | null }

export const moneyFor = (locale: string, settings: RateSettings | null | undefined): Money | null => {
  if (locale !== 'en') return null
  const rate = settings?.exportRate
  if (typeof rate !== 'number' || rate <= 0) return null
  return { currency: settings?.exportCurrency === 'EUR' ? 'EUR' : 'USD', rate }
}
