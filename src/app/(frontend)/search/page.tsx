import type { Metadata } from 'next'
import { LocaleLink as Link } from '@/components/site/LocaleLink'

import { CourseCard } from '@/components/site/CourseCard'
import { ProductCard } from '@/components/site/ProductCard'
import { plural } from '@/lib/format'
import { dictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { payloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Пошук',
  robots: { index: false },
}

type SearchParams = Promise<{ q?: string }>

const SearchPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const { q } = await searchParams
  const query = (q ?? '').trim()

  const payload = await payloadClient()
  const locale = await getLocale()
  const t = dictionary(locale)

  const [products, courses] = query
    ? await Promise.all([
        payload.find({ locale,
          collection: 'products',
          where: {
            status: { equals: 'published' },
            or: [{ title: { like: query } }, { shortDescription: { like: query } }],
          },
          limit: 24,
          depth: 2,
        }),
        payload.find({ locale,
          collection: 'courses',
          where: {
            status: { equals: 'published' },
            or: [{ title: { like: query } }, { tagline: { like: query } }],
          },
          limit: 12,
          depth: 1,
        }),
      ])
    : [{ docs: [] }, { docs: [] }]

  const total = products.docs.length + courses.docs.length

  return (
    <div className="shell pb-24 pt-28 md:pt-36">
      <p className="label">{t.search.label}</p>

      <form action="/search" className="mt-4 max-w-xl">
        <div className="flex border-b border-ink">
          <input
            name="q"
            defaultValue={query}
            autoFocus
            placeholder={t.search.placeholder}
            className="w-full bg-transparent py-3 text-lg outline-none placeholder:text-muted"
          />
          <button type="submit" className="label py-3 text-ink">
            {t.search.submit}
          </button>
        </div>
      </form>

      {query && (
        <p className="mt-6 text-sm text-muted">
          {total > 0 ? t.search.found(total) : t.search.nothing}
        </p>
      )}

      {query && total === 0 && (
        <div className="mt-12 flex flex-wrap gap-3">
          <Link href="/shop" className="btn btn-outline">
            Дивитись усі товари
          </Link>
          <Link href="/courses" className="btn btn-outline">
            Дивитись курси
          </Link>
        </div>
      )}

      {courses.docs.length > 0 && (
        <section className="mt-14">
          <p className="label">Курси</p>
          <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {courses.docs.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                directionSlug={typeof course.direction === 'object' ? (course.direction?.slug ?? '') : ''}
              />
            ))}
          </div>
        </section>
      )}

      {products.docs.length > 0 && (
        <section className="mt-14">
          <p className="label">Товари</p>
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4 md:gap-x-6">
            {products.docs.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default SearchPage
