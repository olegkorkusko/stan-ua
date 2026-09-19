import type { Metadata } from 'next'
import { LocaleLink as Link } from '@/components/site/LocaleLink'
import type { Where } from 'payload'

import { CourseCard } from '@/components/site/CourseCard'
import { FilterDrawer, type FilterGroup } from '@/components/site/FilterDrawer'
import { dictionary } from '@/lib/i18n'
import { getLocale } from '@/lib/locale'
import { payloadClient } from '@/lib/payload'
import { savedItems } from '@/lib/saved'
import type { Course, CourseDirection } from '@/payload-types'
import { SectionLabel, SectionTitle } from '@/components/site/Typography'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Курси',
  description:
    'Усі майстер-класи з вʼязання, бісероплетіння та макраме: фільтри за напрямом і рівнем.',
}

type SearchParams = Promise<{
  direction?: string
  level?: string
  sort?: string
}>

const LEVELS = ['beginner', 'medium', 'advanced'] as const

const buildHref = (
  current: Record<string, string | undefined>,
  patch: Record<string, string | undefined>,
) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries({ ...current, ...patch })) {
    if (value) params.set(key, value)
  }
  const query = params.toString()
  return query ? `/courses/catalog?${query}` : '/courses/catalog'
}

const CoursesCatalogPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const params = await searchParams
  const payload = await payloadClient()
  const locale = await getLocale()
  const t = dictionary(locale)

  // Підписи сортування беремо зі словника, а не з константи модуля: інакше
  // англійська версія каталогу показувала б українські назви — саме так досі
  // поводиться каталог магазину.
  const sorts = [
    { value: '-createdAt', label: t.courses.sortNew },
    { value: 'price', label: t.courses.sortCheap },
    { value: '-price', label: t.courses.sortExpensive },
  ]

  const directions = await payload.find({
    locale,
    collection: 'course-directions',
    sort: 'order',
    limit: 20,
    depth: 0,
  })

  const dirBySlug = new Map(directions.docs.map((d) => [d.slug, d]))
  const activeDir = params.direction ? dirBySlug.get(params.direction) : undefined

  const where: Where = { status: { equals: 'published' } }
  if (activeDir) where.direction = { equals: activeDir.id }
  // Рівень — поле самого курсу (вкладка «Основне»), а не окремого МК усередині
  // масиву lessons. Запит по 'lessons.level' Payload відхиляє з помилкою.
  if (params.level && LEVELS.includes(params.level as (typeof LEVELS)[number])) {
    where.level = { equals: params.level }
  }

  const sort = sorts.some((s) => s.value === params.sort) ? params.sort! : '-createdAt'

  const courses = await payload.find({
    locale,
    collection: 'courses',
    where,
    sort,
    limit: 48,
    depth: 1,
  })

  // Обране читаємо один раз на сторінку, а не по запиту на картку.
  const saved = await savedItems()

  const active = { direction: params.direction, level: params.level, sort: params.sort }
  const hasFilters = Boolean(params.direction || params.level)
  const totalLabel = t.courses.found(courses.totalDocs)

  const directionSlugById = new Map<number, string>()
  for (const dir of directions.docs) {
    if (dir.slug) directionSlugById.set(dir.id, dir.slug)
  }

  const resolveDirectionSlug = (course: Course) => {
    if (typeof course.direction === 'object' && course.direction) {
      return (course.direction as CourseDirection).slug ?? ''
    }
    if (typeof course.direction === 'number') return directionSlugById.get(course.direction) ?? ''
    return ''
  }

  // Групи шухляди. Ціни тут свідомо немає: усі курси коштують 550–1150 ₴, тож
  // будь-які діапазони або зсипали б їх в одну купу, або були б вигадані.
  // Матеріалу, розміру й тривалості в колекції Courses немає взагалі.
  const groups: FilterGroup[] = [
    {
      id: 'sort',
      label: `${t.courses.sort}: ${sorts.find((option) => option.value === sort)?.label ?? ''}`,
      options: sorts.map((option) => ({
        label: option.label,
        href: buildHref(active, { sort: option.value }),
        checked: sort === option.value,
      })),
    },
    {
      id: 'direction',
      label: t.courses.direction,
      open: true,
      options: directions.docs.map((dir) => ({
        label: dir.title,
        href: buildHref(active, {
          direction: params.direction === dir.slug ? undefined : (dir.slug ?? undefined),
        }),
        checked: params.direction === dir.slug,
      })),
    },
    {
      id: 'level',
      label: t.courses.level,
      options: LEVELS.map((lvl) => ({
        label: t.courses.levels[lvl],
        href: buildHref(active, { level: params.level === lvl ? undefined : lvl }),
        checked: params.level === lvl,
      })),
    },
  ].filter((group) => group.options.length > 0)

  // У спокої в рядку лише «Всі фільтри»; група зʼявляється тоді, коли в ній
  // щось обрано, і одразу зі значенням — «НАПРЯМ: МАКРАМЕ».
  const triggers = [
    { label: t.courses.allFilters, active: hasFilters },
    ...groups
      .filter((group) => group.id !== 'sort')
      .flatMap((group) => {
        const picked = group.options.find((option) => option.checked)
        return picked ? [{ label: `${group.label}: ${picked.label}`, active: true }] : []
      }),
  ]

  return (
    <div data-figma-node="34:337" data-figma-state="default" className="page-y flex flex-col">
      {/* Заголовок — 161:4185. Бічні відступи 40 тримає .shell; сітка нижче їх
          не має, тож він живе тут, а не на всій сторінці.

          Рядок фільтрів навмисно НЕ всередині цієї шапки, хоч у макеті вони в
          одному кадрі 161:4184: щоб він прилипав при прокручуванні, він мусить
          бути прямою дитиною високого контейнера сторінки. Усередині шапки
          sticky діяв би лише в межах її власної висоти, тобто ніяк.
          Відступи 20/32 і 32/48 нижче — з макета (gap 32 у 161:4184, gap 48
          у 34:337). */}
      <header data-figma-node="161:4184" className="shell mb-5 flex flex-col md:mb-8">
        <div data-figma-node="161:4185" className="flex flex-col gap-3">
          <SectionLabel data-figma-node="161:4186">{t.courses.label}</SectionLabel>
          <SectionTitle as="h1" data-figma-node="161:4187">
            {activeDir ? activeDir.title : t.courses.catalogTitle}
          </SectionTitle>
        </div>
      </header>

      {/* Фільтри — 161:4188. Рядок і шухляда живуть в одному компоненті, як
          і в магазині: кожна мітка відкриває ту саму панель, тож вони мусять
          ділити один стан.

          Відступ лівої групи тут 24 (161:4189), у магазині 28 (131:2736). */}
      <FilterDrawer
        triggers={triggers}
        sortTrigger={{
          label: groups.find((group) => group.id === 'sort')?.label ?? t.courses.sort,
          active: Boolean(params.sort),
        }}
        countLabel={`(${totalLabel})`}
        reset={hasFilters ? { href: '/courses/catalog', label: t.courses.reset } : undefined}
        title={t.courses.filters}
        closeLabel={t.header.closeMenu}
        applyLabel={t.courses.showCount(courses.totalDocs)}
        groups={groups}
        nodes={{ row: '161:4188', left: '161:4189', right: '161:4197', count: '161:4198' }}
        leftGap={24}
      />

      {/* Сітка — 161:4200. На десктопі кадр 1440 БЕЗ бічних відступів: три
          колонки по 469.33 = (1440 − 2×16)/3, тобто картки йдуть у край
          екрана. На мобільному (303:4635) навпаки — відступи 16 і крок 32.

          На ширших екранах додаємо колонку на тих самих межах, що й у
          магазині (1500 і 1800), але з рахунку 3 → 4 → 5: картка курсу вдвічі
          ширша за товарну, і пʼять у ряд на 1500 зробили б її вужчою за фото. */}
      {courses.docs.length === 0 ? (
        <div className="shell mt-8 py-24 text-center md:mt-12">
          <p className="text-sm text-muted">{t.courses.empty}</p>
          {hasFilters && (
            <Link href="/courses/catalog" className="btn btn-outline mt-6">
              {t.courses.reset}
            </Link>
          )}
        </div>
      ) : (
        <div
          data-figma-node="161:4200"
          className="mt-8 grid w-full grid-cols-1 gap-8 px-5 md:mt-12 md:grid-cols-3 md:gap-4 wide:grid-cols-4 ultra:grid-cols-5"
        >
          {courses.docs.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              directionSlug={resolveDirectionSlug(course)}
              saved={saved.courses.has(course.id)}
              authorized={saved.authorized}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CoursesCatalogPage
