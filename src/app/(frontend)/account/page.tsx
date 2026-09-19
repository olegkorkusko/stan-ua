import type { Metadata } from 'next'
import Image from 'next/image'

import { AccountGuest } from '@/components/site/AccountGuest'
import { AccountShell, type AccountShellNodes } from '@/components/site/AccountShell'
import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { LogoutButton } from '@/components/site/LogoutButton'
import { ResendAccess } from '@/components/site/ResendAccess'
import { accountCustomer } from '@/lib/account'
import { plural } from '@/lib/format'
import { dictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { imageAlt, imageUrl } from '@/lib/media'
import type { Course } from '@/payload-types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Мої доступи',
  robots: { index: false },
}

/*
  «Мої доступи» за макетом (93:1928 на 1440, 306:4757 на 390).

  Рядок курсу: на десктопі обкладинка 112×140, опис і кнопка в один ряд із
  кроком 24; на мобільному та сама трійця колонкою з кроком 14, обкладинка на
  всю ширину заввишки 220. Поля рядка 24 зверху й знизу на обох ширинах.

  Рядки розділені волосінню ЗВЕРХУ, крім першого — у Figma в першого рядка
  stroke вимкнено. Межа висить на самих рядках за індексом, а не через
  `divide-y`: у Tailwind v4 той малює межу ЗНИЗУ всім, крім останнього. Лінії
  на екрані стають ті самі, але звіряння дивиться на конкретні вузли, і рядок,
  у якому межа мала бути зверху, віддавав нуль.

  Поза макетом тут лишились «Вийти», «Видати посилання ще раз» і примітка про
  персональні посилання — свідоме рішення: функції потрібні, намальованого
  місця для них немає. Через них висота кадру більша за намальовану, і пікселі
  на цьому кадрі не збігаються за розміром.
*/

const SHELL_NODES: AccountShellNodes = {
  root: '93:1928',
  heading: '93:1929',
  label: '93:1930',
  title: '93:1931',
  tabs: '137:2930',
  tabAccess: '137:2931',
  tabSaved: '137:2932',
  tabDelivery: '137:2933',
}

const ROW_NODES = [
  { row: '93:1933', cover: '93:1934', body: '93:1935', title: '93:1936', details: '93:1937', action: '93:1938' },
  { row: '93:1940', cover: '93:1941', body: '93:1942', title: '93:1943', details: '93:1944', action: '93:1945' },
  { row: '93:1947', cover: '93:1948', body: '93:1949', title: '93:1950', details: '93:1951', action: '93:1952' },
]

const courseHref = (course: Course): string => {
  const direction = typeof course.direction === 'object' ? course.direction?.slug : null
  return direction ? `/courses/${direction}/${course.slug}` : '/courses'
}

const AccountPage = async () => {
  const t = dictionary(await getLocale())
  const customer = await accountCustomer()

  if (!customer) return <AccountGuest t={t} />

  const access = customer.access ?? []

  return (
    <AccountShell t={t} active="access" nodes={SHELL_NODES} aside={<LogoutButton />}>
      {access.length === 0 ? (
        <div className="border border-flax px-6 py-12 text-center">
          <p className="text-sm text-muted">{t.account.accessEmpty}</p>
          <Link href="/courses" className="btn btn-outline mt-6">
            {t.account.chooseCourse}
          </Link>
        </div>
      ) : (
        <div data-figma-node="93:1932" className="flex flex-col">
          {access.map((item, index) => {
            const course = typeof item.course === 'object' ? item.course : null
            if (!course) return null

            const nodes = ROW_NODES[index]
            const cover = imageUrl(course.cover, 'card')
            const lessons = course.lessons?.length ?? 0
            const details = [
              lessons > 0 ? plural(lessons, 'МК', 'МК', 'МК') : null,
              t.account.accessForever,
            ]
              .filter(Boolean)
              .join(' · ')

            return (
              <div
                key={item.id ?? index}
                data-figma-node={nodes?.row}
                className={`flex flex-col gap-3.5 py-6 md:flex-row md:items-center md:gap-6 ${
                  index > 0 ? 'border-t border-hairline' : ''
                }`}
              >
                <Link
                  href={courseHref(course)}
                  className="relative block h-[220px] w-full shrink-0 overflow-hidden bg-paper-deep transition-opacity hover:opacity-85 active:opacity-70 md:h-[140px] md:w-[112px]"
                >
                  {cover ? (
                    <Image
                      src={cover}
                      alt={imageAlt(course.cover, course.title)}
                      fill
                      sizes="(max-width: 768px) 100vw, 112px"
                      data-figma-node={nodes?.cover}
                      className="object-cover"
                    />
                  ) : (
                    <div data-figma-node={nodes?.cover} className="weave h-full w-full" />
                  )}
                </Link>

                <div
                  data-figma-node={nodes?.body}
                  className="flex min-w-0 flex-1 flex-col gap-2"
                >
                  <p
                    data-figma-node={nodes?.title}
                    className="font-display text-[17px] font-normal leading-[22px] tracking-[-0.005em] text-ink"
                  >
                    <Link
                      href={courseHref(course)}
                      className="thread-link transition-opacity hover:opacity-70 active:opacity-50"
                    >
                      {course.title}
                    </Link>
                  </p>
                  <p
                    data-figma-node={nodes?.details}
                    className="text-[13px] font-normal leading-5 text-muted"
                  >
                    {details}
                  </p>
                  <ResendAccess courseId={course.id} />
                </div>

                {item.telegramInviteLink ? (
                  <a
                    href={item.telegramInviteLink}
                    target="_blank"
                    rel="noreferrer"
                    data-figma-node={nodes?.action}
                    className="btn btn-outline w-full md:w-auto"
                  >
                    <span data-figma-node={`I${nodes?.action};10:15`}>
                      {t.account.openTelegram.toUpperCase()}
                    </span>
                  </a>
                ) : (
                  <span className="text-[13px] leading-5 text-muted">
                    {t.account.preparing}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-muted">{t.account.personalNote}</p>
    </AccountShell>
  )
}

export default AccountPage
