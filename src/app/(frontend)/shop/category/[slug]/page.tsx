import type { Metadata } from 'next'
import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { notFound } from 'next/navigation'

import { Picture } from '@/components/site/Picture'
import { ProductCard } from '@/components/site/ProductCard'
import { cardKey } from '@/lib/cards'
import { dictionary, type Locale } from '@/lib/i18n'
import { imageAlt, imageUrl } from '@/lib/media'
import { getLocale } from '@/lib/locale'
import { payloadClient } from '@/lib/payload'
import { savedItems } from '@/lib/saved'

export const dynamic = 'force-dynamic'

/*
  Сторінка однієї категорії магазину.

  Доти картки «Прикраси», «Набори», «Матеріали» вели у фільтр каталогу —
  /shop/catalog?category=nabory. Формально правильно, по відчуттю ні: людина
  натискала «Набори для створення» в розділі навчання й опинялась у спільній
  сітці товарів із галочкою збоку. Власне звідси й питання клієнтки — «набір
  кинуло в готові вироби», хоча категорія в нього з самого початку була
  правильна.

  Тепер у категорії є власна сторінка: своє фото, свій опис, свої товари —
  рівно те саме, що давно є в напрямів курсів. Дзеркалить
  courses/[direction]/page.tsx свідомо: це один і той самий екран, і
  розʼїхатись вони не повинні.
*/

type Params = Promise<{ slug: string }>

const findCategory = async (slug: string) => {
  const payload = await payloadClient()
  const locale = await getLocale()
  const result = await payload.find({
    locale,
    // Без підстановки мови — як у картках категорій (lib/cards.ts). Інакше
    // порожнє англійське поле підміняється українським, і картка з каталогу
    // називається інакше, ніж заголовок сторінки, на яку вона веде.
    fallbackLocale: false,
    collection: 'categories',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
  })
  return result.docs[0] ?? null
}

/** Те, що показуємо, поки категорію не перекладено: текст із словника. */
const fromDictionary = (locale: Locale, slug: string) =>
  dictionary(locale).shopLanding.categories.items.find((item) => cardKey(item.href) === slug)

export const generateMetadata = async ({ params }: { params: Params }): Promise<Metadata> => {
  const { slug } = await params
  const category = await findCategory(slug)
  if (!category) return {}
  const spare = fromDictionary(await getLocale(), slug)
  return {
    title: category.title || spare?.title || slug,
    description: category.description ?? spare?.subtitle ?? undefined,
  }
}

const CategoryPage = async ({ params }: { params: Params }) => {
  const { slug } = await params
  const category = await findCategory(slug)
  if (!category) notFound()

  const payload = await payloadClient()
  const locale = await getLocale()
  const t = dictionary(locale)
  const spare = fromDictionary(locale, slug)
  const title = category.title || spare?.title || slug
  const description = category.description || spare?.subtitle

  const products = await payload.find({
    locale,
    collection: 'products',
    where: { status: { equals: 'published' }, category: { equals: category.id } },
    limit: 40,
    depth: 1,
  })

  const cover = imageUrl(category.image, 'hero')
  const saved = await savedItems()

  return (
    <div className="pb-24">
      <section className="relative flex h-[52svh] min-h-80 items-end overflow-hidden">
        <div className="absolute inset-0">
          <Picture
            src={cover}
            alt={imageAlt(category.image, title)}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-ink/65 to-ink/20" />
        </div>

        <div className="shell relative pb-10 text-paper">
          <Link href="/shop" className="label text-paper/70 hover:text-paper">
            {t.common.products}
          </Link>
          <h1 className="mt-3 font-display text-hero font-normal">{title}</h1>
        </div>
      </section>

      <div className="shell mt-14">
        {description && (
          <p className="max-w-xl text-[0.9375rem] leading-relaxed text-muted">{description}</p>
        )}

        {products.docs.length > 0 ? (
          <>
            <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-6 md:gap-y-12 lg:grid-cols-4">
              {products.docs.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  saved={saved.products.has(product.id)}
                  authorized={saved.authorized}
                />
              ))}
            </div>

            {/* Вихід у повний каталог із уже накинутим фільтром: звідси людина
                шукає далі, а не повертається на лендинг по колу. */}
            <Link
              href={`/shop/catalog?category=${category.slug}`}
              className="btn btn-outline mt-12 inline-flex"
            >
              {t.common.seeAllProducts}
            </Link>
          </>
        ) : (
          <p className="mt-12 text-sm text-muted">{t.common.soonProducts}</p>
        )}
      </div>
    </div>
  )
}

export default CategoryPage
