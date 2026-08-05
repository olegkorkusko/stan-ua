import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Image from 'next/image'
import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { notFound } from 'next/navigation'

import { headers } from 'next/headers'

import { CourseBuy } from '@/components/site/CourseBuy'
import { courseSchema, JsonLd } from '@/components/site/JsonLd'
import { Reviews } from '@/components/site/Reviews'
import { SaveCourse } from '@/components/site/SaveCourse'
import { plural } from '@/lib/format'
import { imageAlt, imageUrl } from '@/lib/media'
import { dictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { payloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

type Params = Promise<{ direction: string; course: string }>

const findCourse = async (slug: string) => {
  const payload = await payloadClient()
  const locale = await getLocale()
  const result = await payload.find({ locale,
    collection: 'courses',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    limit: 1,
    depth: 2,
  })
  return result.docs[0] ?? null
}

export const generateMetadata = async ({ params }: { params: Params }): Promise<Metadata> => {
  const { course: slug } = await params
  const course = await findCourse(slug)
  if (!course) return {}
  return { title: course.title, description: course.tagline ?? undefined }
}

const CoursePage = async ({ params }: { params: Params }) => {
  const { direction: directionSlug, course: slug } = await params
  const course = await findCourse(slug)
  if (!course) notFound()

  const payload = await payloadClient()
  const locale = await getLocale()
  const t = dictionary(locale)
  const reviews = await payload.find({ locale,
    collection: 'reviews',
    where: { status: { equals: 'approved' }, course: { equals: course.id } },
    limit: 20,
    depth: 0,
    sort: '-createdAt',
  })

  // Чи додано курс в обране — читаємо тут, щоб кнопка одразу малювалась
  // у правильному стані, без блимання після гідратації.
  const { user } = await payload.auth({ headers: await headers() })
  const authorized = user?.collection === 'customers'
  const isSaved = authorized
    ? await payload
        .findByID({ collection: 'customers', id: user.id, depth: 0, overrideAccess: true })
        .then((customer) =>
          (customer.savedCourses ?? []).some((item) =>
            typeof item === 'object' ? item.id === course.id : item === course.id,
          ),
        )
        .catch(() => false)
    : false

  const cover = imageUrl(course.cover, 'hero')
  const lessons = course.lessons ?? []
  const gallery = Array.isArray(course.gallery) ? course.gallery : []

  return (
    <div className="pb-24 pt-24 md:pt-32">
      <JsonLd
        data={courseSchema({
          name: course.title,
          description: course.tagline,
          price: course.price,
          url: `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/courses/${directionSlug}/${course.slug}`,
          lessons: lessons.length,
        })}
      />
      <div className="shell">
        <nav className="label mb-8 flex gap-2" aria-label="Навігація">
          <Link href="/courses" className="hover:text-ink">
            {t.courses.label}
          </Link>
          <span aria-hidden>/</span>
          <Link href={`/courses/${directionSlug}`} className="hover:text-ink">
            {typeof course.direction === 'object' ? course.direction?.title : 'Напрям'}
          </Link>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
          <div>
            <div className="relative aspect-4/3 overflow-hidden bg-paper-deep">
              {cover ? (
                <Image
                  src={cover}
                  alt={imageAlt(course.cover, course.title)}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />
              ) : (
                <div className="weave h-full w-full" />
              )}
            </div>

            {gallery.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {gallery.slice(0, 3).map((media, index) => {
                  const url = imageUrl(media, 'card')
                  return url ? (
                    <div key={index} className="relative aspect-square overflow-hidden bg-paper-deep">
                      <Image
                        src={url}
                        alt={imageAlt(media, course.title)}
                        fill
                        sizes="20vw"
                        className="object-cover"
                      />
                    </div>
                  ) : null
                })}
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <h1 className="text-[clamp(1.875rem,3.5vw,2.75rem)]">{course.title}</h1>
            {course.tagline && <p className="mt-3 text-sm leading-relaxed text-muted">{course.tagline}</p>}

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
              {lessons.length > 0 && <span>{plural(lessons.length, 'МК', 'МК', 'МК')}</span>}
              {course.level && <span>{t.courses.levels[course.level]}</span>}
              <span>{t.courses.forever}</span>
            </div>

            <div className="mt-8">
              <CourseBuy
                courseId={String(course.id)}
                title={course.title}
                href={`/courses/${directionSlug}/${course.slug}`}
                price={course.price}
                oldPrice={course.oldPrice}
                image={imageUrl(course.cover, 'card') ?? undefined}
              />
              <SaveCourse courseId={course.id} initialSaved={isSaved} authorized={authorized} />
            </div>

            {course.description && (
              <div className="mt-10 text-sm leading-relaxed text-muted">
                <RichText data={course.description} />
              </div>
            )}
          </div>
        </div>

        {/* Програма. Нумерація тут доречна: МК проходять по черзі. */}
        {lessons.length > 0 && (
          <section className="mt-24 max-w-3xl">
            <p className="label">{t.courses.programme}</p>
            <h2 className="mt-3 text-[clamp(1.5rem,3vw,2.25rem)]">
              {plural(lessons.length, 'майстер-клас', 'майстер-класи', 'майстер-класів')}
            </h2>

            <ol className="mt-10 border-t border-flax">
              {lessons.map((lesson, index) => (
                <li key={lesson.id ?? index} className="flex gap-6 border-b border-flax py-5">
                  <span className="price shrink-0 text-muted">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    <h3 className="font-body text-base font-medium tracking-normal">{lesson.title}</h3>
                    {lesson.description && (
                      <p className="mt-1 text-sm leading-relaxed text-muted">{lesson.description}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Як приходить доступ — головне питання покупця перед оплатою. */}
        <section className="mt-24 max-w-3xl border border-flax p-8">
          <p className="label">{t.courses.afterPayment}</p>
          <h2 className="mt-3 text-2xl">{t.courses.whatYouGet}</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {course.accessType === 'canva'
              ? 'Одразу після оплати відкриється посилання на проєкт із відео, схемами й рекомендаціями. Воно ж прийде на пошту й лишиться у вашому кабінеті.'
              : 'Одразу після оплати ви отримаєте персональне запрошення в закритий Telegram-канал курсу. Посилання прийде на пошту й лишиться у вашому кабінеті — доступ безтерміновий.'}
          </p>
        </section>

        {course.faq && course.faq.length > 0 && (
          <section className="mt-24 max-w-3xl">
            <p className="label">{t.courses.faq}</p>
            <dl className="mt-8 border-t border-flax">
              {course.faq.map((item, index) => (
                <div key={item.id ?? index} className="border-b border-flax py-5">
                  <dt className="text-base font-medium">{item.question}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-muted">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <Reviews reviews={reviews.docs} target={{ course: course.id }} />
      </div>
    </div>
  )
}

export default CoursePage
