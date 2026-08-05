import type { Metadata } from 'next'
import Image from 'next/image'
import { LocaleLink as Link } from '@/components/site/LocaleLink'

import { CourseCard } from '@/components/site/CourseCard'
import { plural } from '@/lib/format'
import { imageAlt, imageUrl } from '@/lib/media'
import { dictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { payloadClient } from '@/lib/payload'
import type { Course } from '@/payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Курси',
  description:
    'Майстер-класи з вʼязання, бісероплетіння та макраме. Доступ у закритий Telegram одразу після оплати, назавжди.',
}

const CoursesPage = async () => {
  const payload = await payloadClient()
  const locale = await getLocale()
  const t = dictionary(locale)

  const [directions, courses] = await Promise.all([
    payload.find({ locale, collection: 'course-directions', sort: 'order', limit: 20 }),
    payload.find({ locale,
      collection: 'courses',
      where: { status: { equals: 'published' } },
      limit: 60,
      depth: 1,
    }),
  ])

  const byDirection = new Map<number, Course[]>()
  for (const course of courses.docs) {
    const id = typeof course.direction === 'object' ? course.direction?.id : course.direction
    if (typeof id !== 'number') continue
    byDirection.set(id, [...(byDirection.get(id) ?? []), course])
  }

  return (
    <div className="pb-24 pt-28 md:pt-36">
      <div className="shell">
        <p className="label">{t.courses.label}</p>
        <h1 className="mt-3 max-w-3xl text-[clamp(2rem,4.5vw,3.5rem)]">
          {t.courses.title}
        </h1>
        <p className="mt-5 max-w-xl text-[0.9375rem] leading-relaxed text-muted">
          {t.courses.intro}
        </p>
      </div>

      {directions.docs.map((direction) => {
        const list = byDirection.get(direction.id) ?? []
        const cover = imageUrl(direction.image, 'wide')

        return (
          <section key={direction.id} className="shell mt-20">
            <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-12">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <div className="relative aspect-3/2 overflow-hidden bg-paper-deep lg:aspect-4/5">
                  {cover ? (
                    <Image
                      src={cover}
                      alt={imageAlt(direction.image, direction.title)}
                      fill
                      sizes="(max-width: 1024px) 100vw, 30vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="weave h-full w-full" />
                  )}
                </div>
                <h2 className="mt-5 text-2xl">{direction.title}</h2>
                {direction.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted">{direction.description}</p>
                )}
                <p className="mt-3 text-xs text-muted">
                  {list.length ? t.home.coursesCount(list.length) : t.home.soon}
                </p>
              </div>

              {list.length > 0 ? (
                <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2">
                  {list.map((course) => (
                    <CourseCard key={course.id} course={course} directionSlug={direction.slug ?? ''} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center border border-flax py-16">
                  <p className="text-sm text-muted">
                    Курси цього напряму готуються.{' '}
                    <Link href="/#subscribe" className="thread-link text-ink">
                      Повідомимо, коли зʼявляться
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default CoursesPage
