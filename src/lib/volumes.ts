import { payloadClient } from '@/lib/payload'

/*
  Обсяг під карткою напряму чи категорії рахуємо з бази, а не пишемо рядком.

  Раніше «2 курси · від 750 ₴» і «4 товари» лежали текстом у словнику. Їх
  написали під демонстраційні дані й більше не чіпали: курси й товари потім
  помінялись, а підписи лишились — і картка обіцяла те, чого за нею вже немає.
  Саме так «Напрями» показували два курси в кожному напрямі, коли жодного
  опублікованого курсу не було.

  Ключ — slug напряму або категорії, тобто рівно те, що стоїть у href картки.
*/

/** Скільки позицій за карткою і від якої ціни. */
export type Volume = { count: number; from: number }

const tally = (rows: { slug?: string; price: number }[]): Map<string, Volume> => {
  const map = new Map<string, Volume>()
  for (const row of rows) {
    if (!row.slug) continue
    const current = map.get(row.slug)
    map.set(row.slug, {
      count: (current?.count ?? 0) + 1,
      from: current ? Math.min(current.from, row.price) : row.price,
    })
  }
  return map
}

const slugById = (docs: { id: number; slug?: string | null }[]) =>
  new Map(docs.map((doc) => [doc.id, doc.slug ?? undefined]))

/** При depth: 0 звʼязок приходить числом, але глибший запит віддасть обʼєкт. */
const idOf = (value: unknown): number | undefined => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id
    return typeof id === 'number' ? id : undefined
  }
  return undefined
}

/** Опубліковані курси по напрямах. */
export const courseVolumes = async (): Promise<Map<string, Volume>> => {
  const payload = await payloadClient()
  const [directions, courses] = await Promise.all([
    payload.find({ collection: 'course-directions', limit: 50, depth: 0 }),
    payload.find({
      collection: 'courses',
      where: { status: { equals: 'published' } },
      limit: 500,
      depth: 0,
    }),
  ])

  const bySlug = slugById(directions.docs)
  return tally(
    courses.docs.map((course) => ({
      slug: bySlug.get(idOf(course.direction) ?? -1),
      price: course.price,
    })),
  )
}

/** Опубліковані товари по категоріях. */
export const productVolumes = async (): Promise<Map<string, Volume>> => {
  const payload = await payloadClient()
  const [categories, products] = await Promise.all([
    payload.find({ collection: 'categories', limit: 50, depth: 0 }),
    payload.find({
      collection: 'products',
      where: { status: { equals: 'published' } },
      limit: 500,
      depth: 0,
    }),
  ])

  const bySlug = slugById(categories.docs)
  return tally(
    products.docs.map((product) => ({
      slug: bySlug.get(idOf(product.category) ?? -1),
      price: product.price,
    })),
  )
}

/**
 * Slug із посилання картки: /courses/makrame → makrame,
 * /shop/catalog?category=nabory → nabory.
 */
export const volumeKey = (href: string): string | undefined => {
  const [path, query] = href.split('?')
  if (query) return new URLSearchParams(query).get('category') ?? undefined
  return path.split('/').filter(Boolean).pop()
}
