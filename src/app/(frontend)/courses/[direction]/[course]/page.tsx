import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { notFound } from 'next/navigation'

import { headers } from 'next/headers'

import { CourseBuy } from '@/components/site/CourseBuy'
import { courseSchema, JsonLd } from '@/components/site/JsonLd'
import { Reviews } from '@/components/site/Reviews'
import { MediaGallery } from '@/components/site/MediaGallery'
import { SaveButton } from '@/components/site/SaveButton'
import { viewerOwnsCourse } from '@/lib/access'
import { plural } from '@/lib/format'
import { imageAlt, imageUrl } from '@/lib/media'
import { dictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { payloadClient } from '@/lib/payload'
import { SectionLabel, SectionTitle } from '@/components/site/Typography'

export const dynamic = 'force-dynamic'

type Params = Promise<{ direction: string; course: string }>

const findCourse = async (slug: string) => {
  const payload = await payloadClient()
  const locale = await getLocale()
  const result = await payload.find({
    locale,
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
  const reviews = await payload.find({
    locale,
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

  const lessons = course.lessons ?? []

  // Чи цей курс уже куплений: від цього залежить, чи показувати посилання
  // на матеріали кожного майстер-класу.
  const owned = await viewerOwnsCourse(course.id)

  // Обкладинка йде першим кадром слайдера, далі — галерея робіт.
  const courseImages = [course.cover, ...(Array.isArray(course.gallery) ? course.gallery : [])]
    .map((item) => ({ src: imageUrl(item, 'hero'), alt: imageAlt(item, course.title) }))
    .filter((item): item is { src: string; alt: string } => Boolean(item.src))

  return (
    /*
      Без верхнього відступу: кадр «Курс» 32:247 нижче має власний pt 34, як і
      «Товар». Зовнішні pt-24/pt-32 додавали до нього ще 96/128.
    */
    <div className="pb-24">
      <JsonLd
        data={courseSchema({
          name: course.title,
          description: course.tagline,
          price: course.price,
          url: `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}/courses/${directionSlug}/${course.slug}`,
          lessons: lessons.length,
        })}
      />
      {/*
        Кадр «Курс» 32:247 — без бічних відступів, як і «Товар»: фото йде в лівий
        край, свої 64/40 тримає права колонка. Знизу 120 (56 на мобільному) —
        саме цей відступ відділяє контент від сірої смуги відгуків.
      */}
      <div
        data-figma-node="32:247"
        className="mx-auto flex w-full max-w-360 flex-col pt-8.5 pb-14 md:pb-30"
      >
        <div data-figma-node="32:252" className="flex flex-col gap-10 lg:flex-row lg:gap-0">
          {/* Ліва колонка — 386:7151. Слайдер той самий, що й на товарі: фото
              681×782 і стовпчик крапок 7×640 з кроком 72. Дизайнер додав його
              в макет 17.09 — раніше тут була нерухома обкладинка 32:253. */}
          <div className="min-w-0 lg:w-1/2">
            <MediaGallery
              images={courseImages}
              emptyLabel={t.courses.label}
              nodes={{ frame: '386:7151', photo: '386:7152', dots: '386:7153' }}
            />
          </div>

          {/* Права колонка — «Про курс» 32:254: gap 20, падінги 72/40/0/64.
              Крихти тут ПЕРШИМ елементом, як і на товарі (32:248), а не над
              двома колонками — раніше вони висіли над фото на всю ширину. */}
          <div
            data-figma-node="32:254"
            className="flex min-w-0 flex-col gap-5 px-4 lg:w-1/2 lg:px-0 lg:pt-18 lg:pl-16 lg:pr-10"
          >
            <nav data-figma-node="32:248" className="label flex gap-2" aria-label="Навігація">
              <Link href="/courses" className="hover:text-ink">
                {t.courses.label}
              </Link>
              <span aria-hidden>/</span>
              <Link href={`/courses/${directionSlug}`} className="hover:text-ink">
                {typeof course.direction === 'object' ? course.direction?.title : 'Напрям'}
              </Link>
            </nav>

            <SectionTitle as="h1" data-figma-node="32:255">
              {course.title}
            </SectionTitle>
            {course.tagline && (
              <p
                data-figma-node="32:256"
                className="text-[13px] font-normal leading-[19.5px] text-muted"
              >
                {course.tagline}
              </p>
            )}

            <div
              data-figma-node="32:257"
              className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] leading-[19.5px] text-muted"
            >
              {lessons.length > 0 && <span>{plural(lessons.length, 'МК', 'МК', 'МК')}</span>}
              {course.level && <span>{t.courses.levels[course.level]}</span>}
              <span>{t.courses.forever}</span>
            </div>

            {/* Серце йде всередину CourseBuy — в один рядок із кнопкою купівлі,
                як на сторінці товару (148:3561). Підпис «Зберегти на потім»
                прибрано на прохання замовника: лишається сама іконка, а слова
                їдуть у aria-label. */}
            <div data-figma-node="32:261" className="mt-5">
              <CourseBuy
                courseId={String(course.id)}
                title={course.title}
                href={`/courses/${directionSlug}/${course.slug}`}
                price={course.price}
                oldPrice={course.oldPrice}
                image={imageUrl(course.cover, 'card') ?? undefined}
                save={
                  <SaveButton
                    target={{ course: course.id }}
                    initialSaved={isSaved}
                    authorized={authorized}
                    variant="boxed"
                  />
                }
              />
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
          <section data-figma-node="151:3526" className="shell mt-24">
            <div className="max-w-3xl">
              <SectionLabel>{t.courses.programme}</SectionLabel>
              <SectionTitle className="mt-3">
                {plural(lessons.length, 'майстер-клас', 'майстер-класи', 'майстер-класів')}
              </SectionTitle>

              {/*
                Посилання на матеріали бачить лише той, хто курс купив. Перевірка
                серверна, і це принципово: сторінка рендериться на кожен запит
                (force-dynamic), тож чужому в HTML не потрапляє навіть адреса —
                не те що клас, який можна було б показати через інструменти
                розробника. Гість бачить рівно ту саму програму, тільки без
                посилань, і за нею розуміє, що саме купує.
              */}
              {owned && <p className="mt-4 text-sm text-muted">{t.courses.lessonsUnlocked}</p>}

              <ol className="mt-10 border-t border-flax">
                {lessons.map((lesson, index) => (
                  <li key={lesson.id ?? index} className="flex gap-6 border-b border-flax py-5">
                    <span className="price shrink-0 text-muted">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-body text-base font-medium tracking-normal">
                        {lesson.title}
                      </h3>
                      {lesson.description && (
                        <p className="mt-1 text-sm leading-relaxed text-muted">
                          {lesson.description}
                        </p>
                      )}
                      {owned && lesson.canvaUrl && (
                        <a
                          href={lesson.canvaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="thread-link mt-2 inline-block text-sm text-ink"
                        >
                          {t.courses.openLesson}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        {/* Як приходить доступ — головне питання покупця перед оплатою. */}
        <section className="shell mt-24">
          <div className="max-w-3xl border border-flax p-8">
            <p className="label">{t.courses.afterPayment}</p>
            <h2 className="mt-3 text-2xl">{t.courses.whatYouGet}</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {course.accessType === 'canva'
                ? 'Одразу після оплати відкриється посилання на проєкт із відео, схемами й рекомендаціями. Воно ж прийде на пошту й лишиться у вашому кабінеті.'
                : 'Одразу після оплати ви отримаєте персональне запрошення в закритий Telegram-канал курсу. Посилання прийде на пошту й лишиться у вашому кабінеті — доступ безтерміновий.'}
            </p>
          </div>
        </section>
      </div>

      {/* Відгуки — 137:2861. Поза контейнером навмисно: у макеті це смуга
          #F4F4F4 на всі 1440, а вміст усередині вже в контейнері 1360. */}
      <Reviews reviews={reviews.docs} target={{ course: course.id }} />

      {/* «Часті питання» — після відгуків. У макеті сторінки курсу цієї секції
          немає взагалі (за відгуками одразу підвал), тож порядок тут задає
          замовник, а не 32:229. Власний .shell — бо контейнер сторінки
          закрився вище; нижній відступ не дублюємо, він уже є в кореня. */}
      {course.faq && course.faq.length > 0 && (
        <section className="shell max-w-3xl pt-24">
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
    </div>
  )
}

export default CoursePage
