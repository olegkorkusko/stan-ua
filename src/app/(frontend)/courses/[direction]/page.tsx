import type { Metadata } from 'next'
import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { notFound } from 'next/navigation'

import { CourseCard } from '@/components/site/CourseCard'
import { HeroMedia } from '@/components/site/HeroMedia'
import { cardKey } from '@/lib/cards'
import { dictionary, type Locale } from '@/lib/i18n'
import { imageAlt, imageUrl } from '@/lib/media'
import { getLocale } from '@/lib/locale'
import { payloadClient } from '@/lib/payload'
import { savedItems } from '@/lib/saved'

export const dynamic = 'force-dynamic'

type Params = Promise<{ direction: string }>

const findDirection = async (slug: string) => {
  const payload = await payloadClient()
  const locale = await getLocale()
  const result = await payload.find({
    locale,
    /*
      Без підстановки мови — так само, як у картках напрямів (lib/cards.ts).

      З нею порожнє англійське поле підмінялося українським, і виходила
      нісенітниця: у списку напрямів картка називалась «Macramé», а на самій
      сторінці цього ж напряму заголовок був «Макраме». Тепер обидва місця
      беруть переклад з одного джерела — зі словника, поки клієнтка не впише
      англійську назву в адмінці.
    */
    fallbackLocale: false,
    collection: 'course-directions',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  return result.docs[0] ?? null
}

/** Те, що показуємо, коли напрям ще не перекладено: текст із словника. */
const fromDictionary = (locale: Locale, slug: string) =>
  dictionary(locale).coursesLanding.directions.items.find(
    (item) => cardKey(item.href) === slug,
  )

export const generateMetadata = async ({ params }: { params: Params }): Promise<Metadata> => {
  const { direction: slug } = await params
  const direction = await findDirection(slug)
  if (!direction) return {}
  const spare = fromDictionary(await getLocale(), slug)
  return {
    title: direction.title || spare?.title || slug,
    description: direction.description ?? spare?.subtitle ?? undefined,
  }
}

const DirectionPage = async ({ params }: { params: Params }) => {
  const { direction: slug } = await params
  const direction = await findDirection(slug)
  if (!direction) notFound()

  const payload = await payloadClient()
  const locale = await getLocale()
  const t = dictionary(locale)
  const spare = fromDictionary(locale, slug)
  const title = direction.title || spare?.title || slug
  const tagline = direction.tagline || spare?.subtitle
  const description = direction.description

  const courses = await payload.find({ locale,
    collection: 'courses',
    where: { status: { equals: 'published' }, direction: { equals: direction.id } },
    limit: 40,
    depth: 1,
  })

  const cover = imageUrl(direction.image, 'hero')
  const saved = await savedItems()

  return (
    <div className="pb-24">
      <section className="relative flex h-[52svh] min-h-80 items-end overflow-hidden">
        <div className="absolute inset-0">
          {/* У шапці може стояти своє фото або ролик; порожньо — обкладинка. */}
          <HeroMedia
            video={imageUrl(direction.heroVideo)}
            image={imageUrl(direction.heroImage, 'hero') ?? cover}
            alt={imageAlt(direction.heroImage ?? direction.image, title)}
            priority
          />
          <div className="absolute inset-0 bg-linear-to-t from-ink/65 to-ink/20" />
        </div>

        <div className="shell relative pb-10 text-paper">
          <Link href="/courses" className="label text-paper/70 hover:text-paper">
            {t.common.courses}
          </Link>
          {/* Той самий герой, що на лендингах магазину й курсів: підпис
              і великий заголовок поверх темного фото. Тому й кегль спільний —
              токен --text-hero, а не власний clamp, який тут стояв і давав
              на мобільному 32 проти 30 у сусідів. */}
          <h1 className="mt-3 font-display text-hero font-normal">{title}</h1>
          {tagline && <p className="mt-2 text-sm text-paper/80">{tagline}</p>}
        </div>
      </section>

      <div className="shell mt-14">
        {description && (
          <p className="max-w-xl text-[0.9375rem] leading-relaxed text-muted">{description}</p>
        )}

        {courses.docs.length > 0 ? (
          <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {courses.docs.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                directionSlug={direction.slug ?? ''}
                saved={saved.courses.has(course.id)}
                authorized={saved.authorized}
              />
            ))}
          </div>
        ) : (
          <p className="mt-12 text-sm text-muted">{t.common.soonCourses}</p>
        )}
      </div>
    </div>
  )
}

export default DirectionPage
