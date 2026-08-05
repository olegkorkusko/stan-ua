import type { Metadata } from 'next'
import { LocaleLink as Link } from '@/components/site/LocaleLink'
import type { Where } from 'payload'

import { ProductCard } from '@/components/site/ProductCard'
import { getLocale } from '@/lib/locale'
import { payloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Магазин',
  description: 'Прикраси ручної роботи, набори для створення та матеріали. Доставка Новою Поштою.',
}

type SearchParams = Promise<{
  category?: string
  color?: string
  sort?: string
  instock?: string
}>

const SORTS = [
  { value: '-createdAt', label: 'Спочатку нові' },
  { value: 'priceFrom', label: 'Дешевші спершу' },
  { value: '-priceFrom', label: 'Дорожчі спершу' },
]

/** Стан фільтрів живе в адресі: посилання можна переслати, кнопка «назад» працює. */
const buildHref = (current: Record<string, string | undefined>, patch: Record<string, string | undefined>) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value) params.set(key, value)
  }
  const query = params.toString()
  return query ? `/shop?${query}` : '/shop'
}

const ShopPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams
  const payload = await payloadClient()
  const locale = await getLocale()

  const [categories, colors] = await Promise.all([
    payload.find({ locale, collection: 'categories', limit: 20, depth: 0 }),
    payload.find({ locale, collection: 'colors', limit: 40, depth: 0 }),
  ])

  const where: Where = { status: { equals: 'published' } }
  const category = categories.docs.find((c) => c.slug === params.category)
  const color = colors.docs.find((c) => c.slug === params.color)

  if (category) where.category = { equals: category.id }
  if (color) where['variants.color'] = { equals: color.id }
  if (params.instock === '1') where.inStock = { equals: true }

  const sort = SORTS.some((s) => s.value === params.sort) ? params.sort! : '-createdAt'

  const products = await payload.find({ locale, collection: 'products', where, sort, limit: 48, depth: 2 })

  const active = { category: params.category, color: params.color, sort: params.sort, instock: params.instock }
  const hasFilters = Boolean(params.category || params.color || params.instock)

  return (
    <div className="shell pb-24 pt-28 md:pt-36">
      <p className="label">Магазин</p>
      <h1 className="mt-3 text-[clamp(2rem,4vw,3.25rem)]">
        {category ? category.title : 'Усе ручної роботи'}
      </h1>

      {/* Фільтри. Колір — кружечками, бо назва кольору мало що каже. */}
      <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-y border-flax py-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="label">Категорія</span>
          <Link
            href={buildHref(active, { category: undefined })}
            className={`text-sm ${params.category ? 'text-muted' : 'text-ink underline underline-offset-4'}`}
          >
            Усі
          </Link>
          {categories.docs.map((item) => (
            <Link
              key={item.id}
              href={buildHref(active, { category: item.slug ?? undefined })}
              className={`text-sm ${
                params.category === item.slug ? 'text-ink underline underline-offset-4' : 'text-muted'
              }`}
            >
              {item.title}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <span className="label">Колір</span>
          {colors.docs.map((item) => (
            <Link
              key={item.id}
              href={buildHref(active, { color: params.color === item.slug ? undefined : item.slug ?? undefined })}
              title={item.title}
              aria-label={item.title}
              className={`h-4 w-4 rounded-full ring-1 transition-transform hover:scale-110 ${
                params.color === item.slug ? 'ring-ink ring-offset-2' : 'ring-flax'
              }`}
              style={{ background: item.hex }}
            />
          ))}
        </div>

        <Link
          href={buildHref(active, { instock: params.instock === '1' ? undefined : '1' })}
          className={`text-sm ${params.instock === '1' ? 'text-ink underline underline-offset-4' : 'text-muted'}`}
        >
          Лише в наявності
        </Link>

        <div className="ml-auto flex items-center gap-3">
          <span className="label">Сортування</span>
          {SORTS.map((option) => (
            <Link
              key={option.value}
              href={buildHref(active, { sort: option.value })}
              className={`text-sm ${sort === option.value ? 'text-ink underline underline-offset-4' : 'text-muted'}`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted">{products.totalDocs} позицій</p>

      {products.docs.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-sm text-muted">За цими умовами нічого немає.</p>
          {hasFilters && (
            <Link href="/shop" className="btn btn-outline mt-6">
              Скинути фільтри
            </Link>
          )}
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4 md:gap-x-6">
          {products.docs.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  )
}

export default ShopPage
