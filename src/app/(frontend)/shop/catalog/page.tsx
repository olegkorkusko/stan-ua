import type { Metadata } from 'next'
import { LocaleLink as Link } from '@/components/site/LocaleLink'
import type { Where } from 'payload'

import { FilterDrawer, type FilterGroup } from '@/components/site/FilterDrawer'
import { ProductCard } from '@/components/site/ProductCard'
import { dictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { payloadClient } from '@/lib/payload'
import { savedItems } from '@/lib/saved'
import { SectionLabel, SectionTitle } from '@/components/site/Typography'

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
  price?: string
}>

const PRICE_RANGES = [
  { value: '0-500', label: 'до 500 ₴', min: 0, max: 500 },
  { value: '500-1000', label: '500–1000 ₴', min: 500, max: 1000 },
  { value: '1000-', label: 'від 1000 ₴', min: 1000, max: null },
]

const SORTS = [
  { value: '-createdAt', label: 'Спочатку нові' },
  { value: 'priceFrom', label: 'Дешевші спершу' },
  { value: '-priceFrom', label: 'Дорожчі спершу' },
]

const buildHref = (
  current: Record<string, string | undefined>,
  patch: Record<string, string | undefined>,
) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value) params.set(key, value)
  }
  const query = params.toString()
  return query ? `/shop/catalog?${query}` : '/shop/catalog'
}

const ShopCatalogPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams
  const payload = await payloadClient()
  const locale = await getLocale()
  const t = dictionary(locale)

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

  const range = PRICE_RANGES.find((item) => item.value === params.price)
  if (range) {
    where.priceFrom = range.max
      ? { greater_than_equal: range.min, less_than_equal: range.max }
      : { greater_than_equal: range.min }
  }

  const sort = SORTS.some((s) => s.value === params.sort) ? params.sort! : '-createdAt'

  const products = await payload.find({
    locale,
    collection: 'products',
    where,
    sort,
    limit: 48,
    depth: 2,
  })

  // Обране читаємо один раз на сторінку, а не по запиту на картку.
  const saved = await savedItems()

  const active = {
    category: params.category,
    color: params.color,
    sort: params.sort,
    instock: params.instock,
    price: params.price,
  }
  const hasFilters = Boolean(params.category || params.color || params.instock || params.price)
  const totalLabel = t.shop.found(products.totalDocs)

  // Групи для шухляди фільтрів. Порядок і склад — з макета, за винятком
  // «МАТЕРІАЛ» і «РОЗМІР»: під них у проєкті немає ні полів, ні колекцій,
  // тож порожні акордеони не показуємо. «Ціна» й «Наявність» навпаки
  // працюють у коді, але в макеті сховані — лишаємо, бо вони корисні.
  const groups: FilterGroup[] = [
    {
      id: 'sort',
      label: `${t.shop.sort}: ${SORTS.find((option) => option.value === sort)?.label ?? ''}`,
      options: SORTS.map((option) => ({
        label: option.label,
        href: buildHref(active, { sort: option.value }),
        checked: sort === option.value,
      })),
    },
    {
      id: 'category',
      label: t.shop.category,
      open: true,
      options: categories.docs.map((item) => ({
        label: item.title,
        href: buildHref(active, {
          category: params.category === item.slug ? undefined : (item.slug ?? undefined),
        }),
        checked: params.category === item.slug,
      })),
    },
    {
      id: 'color',
      label: t.shop.color,
      options: colors.docs.map((item) => ({
        label: item.title,
        href: buildHref(active, {
          color: params.color === item.slug ? undefined : (item.slug ?? undefined),
        }),
        checked: params.color === item.slug,
        hex: item.hex,
      })),
    },
    {
      id: 'price',
      label: t.shop.price,
      options: PRICE_RANGES.map((item) => ({
        label: item.label,
        href: buildHref(active, { price: params.price === item.value ? undefined : item.value }),
        checked: params.price === item.value,
      })),
    },
    {
      id: 'instock',
      label: t.shop.availability,
      options: [
        {
          label: t.shop.inStockOnly,
          href: buildHref(active, { instock: params.instock === '1' ? undefined : '1' }),
          checked: params.instock === '1',
        },
      ],
    },
  ].filter((group) => group.options.length > 0)

  // Мітки рядка каталогу. У спокої там лише «Всі фільтри»; група зʼявляється
  // тоді, коли в ній щось обрано, і одразу зі значенням — «КАТЕГОРІЯ: ГОТОВІ
  // ПРИКРАСИ». Так рядок показує саме те, що відфільтровано, і не тримає
  // порожніх назв, за якими нічого не стоїть.
  const triggers = [
    { label: t.shop.allFilters, active: hasFilters },
    ...groups
      .filter((group) => group.id !== 'sort')
      .flatMap((group) => {
        const picked = group.options.find((option) => option.checked)
        if (!picked) return []
        // Колір читається кольором, а не словом, тому для варіантів зі свотчем
        // лишаємо саму назву групи й малюємо кружечок.
        return picked.hex
          ? [{ label: group.label, hex: picked.hex, valueLabel: picked.label, active: true }]
          : [{ label: `${group.label}: ${picked.label}`, active: true }]
      }),
  ]

  return (
    <div data-figma-node="30:110" data-figma-state="default" className="page-y flex flex-col">
      {/* Заголовок — 30:111. Бічні відступи 40 тримає .shell; сітка нижче їх
          не має, тож він живе тут, а не на всій сторінці.

          Рядок фільтрів навмисно НЕ всередині цієї шапки, хоч у макеті вони в
          одному кадрі 130:2720: щоб він прилипав при прокручуванні, він мусить
          бути прямою дитиною високого контейнера сторінки. Усередині шапки
          sticky діяв би лише в межах її власної висоти, тобто ніяк. */}
      <header data-figma-node="130:2720" className="shell mb-5 flex flex-col md:mb-8">
        <div data-figma-node="30:111" className="flex flex-col gap-3">
          <SectionLabel data-figma-node="30:112">{t.shop.label}</SectionLabel>
          <SectionTitle as="h1" data-figma-node="30:113">
            {category ? category.title : t.shop.title}
          </SectionTitle>
        </div>
      </header>

      {/* Фільтри — 30:114. Весь рядок рендерить FilterDrawer: і мітки груп,
          і сортування відкривають ту саму панель, тож вони мають ділити
          один стан. */}
      <FilterDrawer
        triggers={triggers}
        sortTrigger={{
          label: groups.find((group) => group.id === 'sort')?.label ?? t.shop.sort,
          active: Boolean(params.sort),
        }}
        countLabel={`(${totalLabel})`}
        reset={hasFilters ? { href: '/shop/catalog', label: t.shop.reset } : undefined}
        title={t.shop.filters}
        closeLabel={t.header.closeMenu}
        applyLabel={t.shop.showCount(products.totalDocs)}
        groups={groups}
        nodes={{ row: '30:114', left: '131:2736', right: '131:2741', count: '131:2742' }}
      />

      {/* Сітка — 30:134. Кадр 1440 БЕЗ бічних відступів: чотири колонки по
          348 = (1440 − 3×16)/4, картки йдуть у край екрана. На мобільному
          (у кадрі 302:3999) так само в край: дві колонки по 190 з проміжком
          10, тобто 190 + 10 + 190 = 390 рівно.

          Ширші за макет екрани макет не описує, тож додаємо колонки, а не
          розтягуємо картки: від 1500 — пʼять, від 1800 — шість. Числа підібрані
          так, щоб картка лишалась однакова: (1500−4×16)/5 = (1800−5×16)/6 = 287.
          Межі 1440 тут немає навмисно — інакше зайва ширина йшла б у поля. */}
      {products.docs.length === 0 ? (
        <div className="shell mt-8 py-24 text-center md:mt-12">
          <p className="text-sm text-muted">{t.shop.empty}</p>
          {hasFilters && (
            <Link href="/shop/catalog" className="btn btn-outline mt-6">
              {t.shop.reset}
            </Link>
          )}
        </div>
      ) : (
        <div
          data-figma-node="30:134"
          className="mt-8 grid w-full grid-cols-2 gap-2.5 px-5 md:mt-12 md:grid-cols-4 md:gap-4 wide:grid-cols-5 ultra:grid-cols-6"
        >
          {products.docs.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              saved={saved.products.has(product.id)}
              authorized={saved.authorized}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ShopCatalogPage
