import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'

import { AuthForm } from '@/components/site/AuthForm'
import { LogoutButton } from '@/components/site/LogoutButton'
import { ResendAccess } from '@/components/site/ResendAccess'
import { imageAlt, imageUrl } from '@/lib/media'
import { payloadClient } from '@/lib/payload'
import type { Course } from '@/payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Кабінет',
  robots: { index: false },
}

const courseHref = (course: Course): string => {
  const direction = typeof course.direction === 'object' ? course.direction?.slug : null
  return direction ? `/courses/${direction}/${course.slug}` : '/courses'
}

const AccountPage = async () => {
  const payload = await payloadClient()
  const { user } = await payload.auth({ headers: await headers() })

  if (!user || user.collection !== 'customers') {
    return (
      <div className="shell py-32">
        <p className="label text-center">Кабінет</p>
        <h1 className="mt-3 text-center text-[clamp(1.75rem,3.5vw,2.75rem)]">Ваші курси й обране</h1>
        <div className="mt-12">
          <AuthForm />
        </div>
      </div>
    )
  }

  const customer = await payload.findByID({
    collection: 'customers',
    id: user.id,
    depth: 2,
    overrideAccess: true,
  })

  const access = customer.access ?? []
  const saved = (customer.savedCourses ?? []).filter((item): item is Course => typeof item === 'object')

  return (
    <div className="shell pb-24 pt-28 md:pt-36">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label">Кабінет</p>
          <h1 className="mt-3 text-[clamp(1.75rem,3.5vw,2.75rem)]">{customer.name || customer.email}</h1>
        </div>
        <LogoutButton />
      </div>

      <section className="mt-16">
        <p className="label">Мої доступи</p>

        {access.length === 0 ? (
          <div className="mt-6 border border-flax px-6 py-12 text-center">
            <p className="text-sm text-muted">Тут зʼявляться курси, які ви купите.</p>
            <Link href="/courses" className="btn btn-outline mt-6">
              Обрати курс
            </Link>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-flax border-y border-flax">
            {access.map((item, index) => {
              const course = typeof item.course === 'object' ? item.course : null
              if (!course) return null
              const cover = imageUrl(course.cover, 'thumbnail')

              return (
                <li key={item.id ?? index} className="flex flex-wrap items-center gap-5 py-5">
                  <Link href={courseHref(course)} className="shrink-0">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={imageAlt(course.cover, course.title)}
                        width={72}
                        height={90}
                        className="h-22 w-18 object-cover"
                      />
                    ) : (
                      <div className="weave h-22 w-18" />
                    )}
                  </Link>

                  <div className="min-w-50 flex-1">
                    <Link href={courseHref(course)} className="text-base">
                      {course.title}
                    </Link>
                    <p className="mt-1 text-xs text-muted">Доступ безтерміновий</p>
                    <div className="mt-1.5">
                      <ResendAccess courseId={course.id} />
                    </div>
                  </div>

                  {item.telegramInviteLink ? (
                    <a
                      href={item.telegramInviteLink}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline"
                    >
                      Відкрити матеріали
                    </a>
                  ) : (
                    <span className="text-xs text-muted">Посилання готується</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}

        <p className="mt-4 text-xs text-muted">
          Посилання персональні — не пересилайте їх іншим.
        </p>
      </section>

      {saved.length > 0 && (
        <section className="mt-20">
          <p className="label">Збережені курси</p>
          <ul className="mt-6 divide-y divide-flax border-y border-flax">
            {saved.map((course) => (
              <li key={course.id} className="flex items-center justify-between gap-5 py-4">
                <Link href={courseHref(course)} className="text-base">
                  {course.title}
                </Link>
                <span className="price text-brass">{course.price} ₴</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default AccountPage
