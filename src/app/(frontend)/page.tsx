import Image from 'next/image'
import { LocaleLink as Link } from '@/components/site/LocaleLink'

import { ProductCard } from '@/components/site/ProductCard'
import { ThreadFork } from '@/components/site/ThreadFork'
import { formatPrice, plural } from '@/lib/format'
import { imageAlt, imageUrl } from '@/lib/media'
import { dictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { payloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

const HomePage = async () => {
  const payload = await payloadClient()
  const locale = await getLocale()
  const t = dictionary(locale)

  const [settings, directions, products, courses, reviews] = await Promise.all([
    payload.findGlobal({ locale, slug: 'settings' }).catch(() => null),
    payload
      .find({ collection: 'course-directions', sort: 'order', limit: 3 })
      .catch(() => ({ docs: [] as never[] })),
    payload
      .find({
        collection: 'products',
        where: { status: { equals: 'published' }, featured: { equals: true } },
        limit: 4,
        depth: 2,
      })
      .catch(() => ({ docs: [] as never[] })),
    payload
      .find({ collection: 'courses', where: { status: { equals: 'published' } }, limit: 100, depth: 0 })
      .catch(() => ({ docs: [] as never[] })),
    payload
      .find({ collection: 'reviews', where: { status: { equals: 'approved' } }, limit: 3, depth: 0 })
      .catch(() => ({ docs: [] as never[] })),
  ])

  const heroImage = imageUrl(settings?.heroMedia, 'hero')

  // Скільки курсів у кожному напрямі й від якої ціни — щоб картка напряму
  // одразу відповідала на «а що там і скільки коштує».
  const stats = new Map<number, { count: number; from: number }>()
  for (const course of courses.docs) {
    const id = typeof course.direction === 'object' ? course.direction?.id : course.direction
    if (typeof id !== 'number') continue
    const current = stats.get(id) ?? { count: 0, from: Infinity }
    stats.set(id, { count: current.count + 1, from: Math.min(current.from, course.price ?? Infinity) })
  }

  return (
    <>
      {/* Головний екран. Фон повільно дрейфує — те саме «рухоме зображення»,
          яке сподобалось клієнтці на mejuri. */}
      <section className="relative flex h-[86svh] min-h-125 items-end overflow-hidden">
        <div className="absolute inset-0">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={imageAlt(settings?.heroMedia, '')}
              fill
              priority
              sizes="100vw"
              className="drift object-cover"
            />
          ) : (
            <div className="weave drift h-full w-full" />
          )}
          <div className="absolute inset-0 bg-linear-to-t from-ink/70 via-ink/25 to-ink/30" />
        </div>

        <div className="shell relative pb-14 text-paper md:pb-20">
          <p className="label rise text-paper/70">{t.home.eyebrow}</p>
          <h1 className="rise mt-4 max-w-4xl text-[clamp(2.25rem,6vw,4.75rem)]">
            {settings?.heroTitle ?? t.home.heroTitle}
          </h1>
          <p className="rise mt-5 max-w-md text-[0.9375rem] leading-relaxed text-paper/80">
            {settings?.heroSubtitle ?? t.home.heroSubtitle}
          </p>
          <div className="rise mt-8 flex flex-wrap gap-3">
            <Link href="/courses" className="btn bg-paper text-ink hover:bg-flax">
              {t.home.ctaCourses}
            </Link>
            <Link href="/shop" className="btn border border-paper text-paper hover:bg-paper hover:text-ink">
              {t.home.ctaShop}
            </Link>
          </div>
        </div>
      </section>

      {/* Три напрями. Нитка приходить згори однією лінією й ділиться на три. */}
      <section id="directions" className="shell pt-16 md:pt-20">
        <div className="text-center">
          <p className="label">{t.home.directionsLabel}</p>
          <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)]">{t.home.directionsTitle}</h2>
        </div>

        <ThreadFork />

        <div className="mt-8 grid gap-x-6 gap-y-10 md:mt-0 md:grid-cols-3">
          {directions.docs.map((direction) => {
            const stat = stats.get(direction.id)
            const cover = imageUrl(direction.image, 'card')

            return (
              <Link key={direction.id} href={`/courses/${direction.slug}`} className="group block">
                <div className="relative aspect-4/5 overflow-hidden bg-paper-deep">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={imageAlt(direction.image, direction.title)}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="weave h-full w-full transition-transform duration-700 group-hover:scale-105" />
                  )}
                </div>
                <h3 className="mt-4 text-xl">{direction.title}</h3>
                {direction.tagline && <p className="mt-1.5 text-sm text-muted">{direction.tagline}</p>}
                <p className="mt-3 text-xs text-muted">
                  {stat
                    ? `${t.home.coursesCount(stat.count)} · ${formatPrice(stat.from)}`
                    : t.home.soon}
                </p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Як це працює. Нумерація тут по суті: це послідовність кроків. */}
      <section className="mt-24 border-y border-flax bg-paper-deep py-16 md:py-20">
        <div className="shell">
          <p className="label">{t.home.stepsLabel}</p>
          <h2 className="mt-3 max-w-2xl text-[clamp(1.75rem,3.5vw,2.75rem)]">
            {t.home.stepsTitle}
          </h2>

          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
            {t.home.steps.map((step, index) => (
              <li key={step.title}>
                <span className="font-display text-sm text-brass">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <hr className="thread my-4 bg-ink/15" />
                <h3 className="font-body text-base font-medium tracking-normal">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Магазин */}
      {products.docs.length > 0 && (
        <section className="shell mt-24">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="label">{t.home.shopLabel}</p>
              <h2 className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)]">{t.home.shopTitle}</h2>
            </div>
            <Link href="/shop" className="thread-link hidden text-sm md:inline-block">
              {t.nav.allProducts}
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4 md:gap-x-6">
            {products.docs.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <Link href="/shop" className="btn btn-outline mt-10 w-full md:hidden">
            {t.nav.allProducts}
          </Link>
        </section>
      )}

      {/* Відгуки */}
      {reviews.docs.length > 0 && (
        <section className="shell mt-24">
          <p className="label text-center">{t.home.reviewsLabel}</p>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {reviews.docs.map((review) => (
              <figure key={review.id}>
                <hr className="thread mb-5" />
                <blockquote className="text-[0.9375rem] leading-relaxed">«{review.text}»</blockquote>
                <figcaption className="label mt-4">{review.authorName}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}
    </>
  )
}

export default HomePage
