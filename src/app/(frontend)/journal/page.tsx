import type { Metadata } from 'next'

import { ArticleCard, type ArticleCardNodes } from '@/components/site/ArticleCard'
import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { dictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { imageAlt, imageUrl } from '@/lib/media'
import { payloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Журнал',
  description: 'Гайди й поради про вʼязання, бісероплетіння та макраме: з чого почати й що купити.',
}

/*
  Журнал за макетом (155:3598 на 1440, 303:4638 на 390).

  Три блоки в колонку: заголовок, рядок тегів і сітка статей. Крок між ними
  32 на мобільному й 64 з md — це gap самого кадру, тому вертикальних відступів
  на блоках немає.

  Рядок тегів у макеті — автолейаут із тонкими нитками зверху й знизу
  (stroke #16150F на 14%, тільки верх і низ). Stroke там INSIDE, тобто висоти
  рядку не додає, тож нитки намальовані псевдоелементами: CSS-рамка розсунула б
  ритм на 2 px, а рядок має лишатися 43 на десктопі й 68 на мобільному.

  Висоти рядків цілі (15, 25, 31), хоча в токенах 15.4, 25.08 і 30.78: Figma
  верстає текст у цілих коробках, і висота кадру (962 і 1872) складена саме
  з них. З дробовими сторінка виходить на пів пікселя вищою за макет.
*/

const TAG_NODE_IDS = ['155:3603', '155:3604', '155:3605', '155:3606', '155:3607', '155:3608']

const CARD_NODES: ArticleCardNodes[] = [
  {
    root: '155:3610',
    cover: 'I155:3610;97:3',
    body: 'I155:3610;162:4',
    meta: 'I155:3610;97:4',
    title: 'I155:3610;97:5',
    excerpt: 'I155:3610;97:6',
  },
  {
    root: '155:3615',
    cover: 'I155:3615;97:3',
    body: 'I155:3615;162:4',
    meta: 'I155:3615;97:4',
    title: 'I155:3615;97:5',
    excerpt: 'I155:3615;97:6',
  },
  {
    root: '155:3620',
    cover: 'I155:3620;97:3',
    body: 'I155:3620;162:4',
    meta: 'I155:3620;97:4',
    title: 'I155:3620;97:5',
    excerpt: 'I155:3620;97:6',
  },
]

type SearchParams = Promise<{ tag?: string }>

/*
  Дата в картці — «20 БЕРЕЗНЯ», без року: так у макеті. Регістр робить CSS,
  а місяць береться зі словника, інакше англійська версія показувала б
  українські назви.

  Читаємо в UTC, а не в часовому поясі сервера: у Payload дата публікації —
  поле «лише день», і на сервері західніше за Грінвіч локальні геттери
  показували б учорашнє число.
*/
const formatDay = (value: string, months: string[]) => {
  const date = new Date(value)
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]}`
}

const JournalPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams
  const payload = await payloadClient()
  const locale = await getLocale()
  const t = dictionary(locale)

  const posts = await payload.find({
    locale,
    collection: 'posts',
    where: { status: { equals: 'published' } },
    sort: '-publishedAt',
    limit: 30,
    depth: 1,
  })

  // Теги збираємо з самих статей у порядку їх виходу — окремого довідника
  // тегів у Payload немає, а захардкоджений список розʼїхався б із текстами.
  const tags: string[] = []
  for (const post of posts.docs) {
    for (const tag of post.tags ?? []) {
      if (tag && !tags.includes(tag)) tags.push(tag)
    }
  }

  const activeTag = params.tag && tags.includes(params.tag) ? params.tag : undefined
  // Фільтруємо вже отриманий список, а не другим запитом: рядок тегів однаково
  // мусить показувати ВСІ теги, тож усі статті вже тут.
  const visible = activeTag
    ? posts.docs.filter((post) => post.tags?.includes(activeTag))
    : posts.docs

  const tagHref = (tag?: string) => (tag ? `/journal?tag=${encodeURIComponent(tag)}` : '/journal')

  return (
    <div
      data-figma-node="155:3598"
      data-figma-state="default"
      className="shell page-y flex flex-col gap-8 md:gap-16"
    >
      <div data-figma-node="155:3599" className="flex flex-col gap-4">
        <p
          data-figma-node="155:3600"
          className="text-[11px] font-semibold uppercase leading-[15px] tracking-[0.16em] text-muted"
        >
          {t.journal.label}
        </p>
        <h1
          data-figma-node="155:3601"
          className="font-display text-title font-normal text-ink md:text-[27px] md:leading-[31px]"
        >
          {t.journal.title}
        </h1>
      </div>

      <nav
        data-figma-node="155:3602"
        aria-label={t.journal.label}
        className="relative flex flex-wrap items-center gap-x-[18px] gap-y-2.5 py-3.5 before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-hairline after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-hairline md:gap-[26px]"
      >
        {[undefined, ...tags].map((tag, index) => {
          const current = tag === activeTag
          const label = (tag ?? t.journal.all).toUpperCase()
          /*
            py/-my: напис у макеті має 15 px висоти, а це замало, щоб у нього
            влучити пальцем (WCAG 2.5.8 просить від 24). Поле збільшує зону
            натискання до 25 px, від'ємне повертає рядку намальовану висоту —
            43 на десктопі, 68 на мобільному. Більше не беремо: на мобільному
            рядки тегів стоять за 25 px один від одного, і зони почали б
            перекриватися.

            -me: CSS додає міжлітерний інтервал і ПІСЛЯ останньої літери,
            Figma — ні. Через це кожен тег був на 1.76 px ширший за
            намальований, і теги повзли вправо: до «НАБОРИ» набігало 4 px.
          */
          const shared = `-me-[0.16em] -my-[5px] py-[5px] text-[11px] font-semibold uppercase leading-[15px] tracking-[0.16em]`

          // Активний тег — не посилання: воно вело б на той самий перелік,
          // який уже відкрито.
          return current ? (
            <span
              key={tag ?? 'all'}
              aria-current="page"
              data-figma-node={TAG_NODE_IDS[index]}
              className={`${shared} text-ink`}
            >
              {label}
            </span>
          ) : (
            <Link
              key={tag ?? 'all'}
              href={tagHref(tag)}
              data-figma-node={TAG_NODE_IDS[index]}
              className={`${shared} text-muted transition-colors hover:text-ink active:text-ink/70`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {visible.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-sm text-muted">{t.journal.empty}</p>
          {activeTag && (
            <Link href="/journal" className="btn btn-outline mt-6">
              {t.shop.reset}
            </Link>
          )}
        </div>
      ) : (
        <div
          data-figma-node="155:3609"
          /* В один стовпчик картки йдуть у край екрана — від'ємне поле гасить
             жолоб .shell (16px до 768). Робимо це тут, а не в картці: жолоб
             належить сторінці, і картка не мусить знати, в які поля її вклали.
             З sm починаються колонки, і поля повертаються. */
          className="-mx-4 flex flex-col gap-9 sm:mx-0 sm:flex-row sm:flex-wrap lg:gap-8"
        >
          {visible.map((post, index) => {
            const cover = imageUrl(post.cover, 'hero')
            const tag = post.tags?.[0]
            const day = post.publishedAt ? formatDay(post.publishedAt, t.journal.months) : null

            return (
              <div
                key={post.id}
                className="sm:w-[calc((100%-36px)/2)] lg:w-[calc((100%-64px)/3)]"
              >
                <ArticleCard
                  href={`/journal/${post.slug}`}
                  title={post.title}
                  meta={[tag, day].filter(Boolean).join(' · ').toUpperCase()}
                  excerpt={post.excerpt}
                  cover={cover ? { src: cover, alt: imageAlt(post.cover, post.title) } : null}
                  nodes={CARD_NODES[index]}
                  priority={index < 3}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default JournalPage
