import { imageUrl } from '@/lib/media'
import { payloadClient } from '@/lib/payload'
import type { Locale } from '@/lib/i18n'

/*
  Картки напрямів на /courses і категорій на /shop — з бази, а не з коду.

  Раніше в словнику лежало все: і назва, і підпис, і рядок «2 курси · від
  750 ₴». Написали це під демонстраційні дані й більше не чіпали. Через те
  картка «Прикраси з бісеру» обіцяла два курси там, де не було жодного, а
  назва в адмінці («Готові прикраси») на сайт не потрапляла взагалі —
  редагуєш категорію, а на вітрині нічого не змінюється.

  Тепер з бази приходить усе, що там є, а код лишається запасним варіантом:
  порожнє поле в адмінці не стирає текст із словника. Те саме правило, що й
  у lib/landing.ts для текстів лендингів.

  Ключ — slug напряму чи категорії, тобто рівно те, що стоїть у href картки.
*/

export type Card = {
  /** Скільки опублікованих позицій за карткою. */
  count: number
  /** Найдешевша з них. */
  from: number
  /** З адмінки; порожнє — сторінка бере назву з коду. */
  title?: string
  subtitle?: string
  image?: string
}

type Related = { id: number; slug?: string | null }

const idOf = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id
    return typeof id === 'number' ? id : undefined
  }
  return undefined
}

const nonEmpty = (value: unknown): string | undefined => {
  const text = typeof value === 'string' ? value.trim() : ''
  return text.length > 0 ? text : undefined
}

/** Обсяг рахуємо самі: count() на кожну картку — це запит на картку. */
const tally = (
  owners: (Related & { title?: string | null; subtitle?: unknown; image?: unknown })[],
  rows: { owner: unknown; price: number }[],
): Map<string, Card> => {
  const slugById = new Map(owners.map((owner) => [owner.id, owner.slug ?? undefined]))
  const cards = new Map<string, Card>()

  for (const owner of owners) {
    if (!owner.slug) continue
    cards.set(owner.slug, {
      count: 0,
      from: 0,
      title: nonEmpty(owner.title),
      subtitle: nonEmpty(owner.subtitle),
      image: imageUrl(owner.image as never, 'card') ?? undefined,
    })
  }

  for (const row of rows) {
    const slug = slugById.get(idOf(row.owner) ?? -1)
    const card = slug ? cards.get(slug) : undefined
    if (!card) continue
    card.from = card.count === 0 ? row.price : Math.min(card.from, row.price)
    card.count += 1
  }

  return cards
}

/** Напрями курсів: назва, підпис, обкладинка й скільки опублікованих курсів. */
export const directionCards = async (locale: Locale): Promise<Map<string, Card>> => {
  const payload = await payloadClient()
  const [directions, courses] = await Promise.all([
    // depth: 1 — щоб обкладинка прийшла документом, а не самим лише id.
    payload.find({
      collection: 'course-directions',
      locale,
      fallbackLocale: false,
      limit: 50,
      depth: 1,
    }),
    payload.find({
      collection: 'courses',
      where: { status: { equals: 'published' } },
      limit: 500,
      depth: 0,
    }),
  ])

  return tally(
    directions.docs.map((doc) => ({
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      subtitle: doc.tagline,
      image: doc.image,
    })),
    courses.docs.map((course) => ({ owner: course.direction, price: course.price })),
  )
}

/**
 * Вітрина магазину: категорії з галочкою «Показувати на сторінці Магазин»,
 * у заданому порядку.
 *
 * Список приходить із бази, а не з коду. Доти три картки були зашиті разом
 * з адресами, і «Набори для створення» висіли в магазині, хоч належать
 * навчанню, — прибрати їх або додати нову категорію можна було лише
 * правкою коду.
 */
export const shopCategories = async (locale: Locale) => {
  const payload = await payloadClient()
  const where = { showInShop: { not_equals: false } }

  const [categories, ukrainian, cards] = await Promise.all([
    payload.find({ collection: 'categories', where, sort: 'order', locale, fallbackLocale: false, limit: 20, depth: 0 }),
    /*
      Українські назви окремим запитом — як останній запас для англійської
      версії. Підміняти мову на рівні Payload не можна: тоді «Готові
      прикраси» перебили б готовий переклад зі словника. А показувати замість
      назви slug, як було з новою категорією, — гірше за будь-яку з мов.
    */
    payload.find({ collection: 'categories', where, limit: 20, depth: 0, locale: 'uk' }),
    categoryCards(locale),
  ])

  const titleUk = new Map(ukrainian.docs.map((doc) => [doc.slug ?? '', doc.title]))

  return categories.docs
    .filter((doc): doc is typeof doc & { slug: string } => Boolean(doc.slug))
    .map((doc) => ({
      slug: doc.slug,
      href: `/shop/category/${doc.slug}`,
      card: cards.get(doc.slug),
      titleUk: titleUk.get(doc.slug),
    }))
}

/** Категорії магазину: те саме, тільки по товарах. */
export const categoryCards = async (locale: Locale): Promise<Map<string, Card>> => {
  const payload = await payloadClient()
  const [categories, products] = await Promise.all([
    payload.find({
      collection: 'categories',
      locale,
      fallbackLocale: false,
      limit: 50,
      depth: 1,
    }),
    payload.find({
      collection: 'products',
      where: { status: { equals: 'published' } },
      limit: 500,
      depth: 0,
    }),
  ])

  return tally(
    categories.docs.map((doc) => ({
      id: doc.id,
      slug: doc.slug,
      title: doc.title,
      subtitle: doc.description,
      image: doc.image,
    })),
    products.docs.map((product) => ({ owner: product.category, price: product.price })),
  )
}

/**
 * Slug із посилання картки: /courses/makrame → makrame,
 * /shop/catalog?category=nabory → nabory.
 */
export const cardKey = (href: string): string | undefined => {
  const [path, query] = href.split('?')
  if (query) return new URLSearchParams(query).get('category') ?? undefined
  return path.split('/').filter(Boolean).pop()
}
