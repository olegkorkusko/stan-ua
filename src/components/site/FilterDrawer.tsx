'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { SideDrawer } from '@/components/site/SideDrawer'

export type FilterOption = {
  label: string
  href: string
  checked: boolean
  /** Колір свотча для групи «Колір»; для решти груп порожній. */
  hex?: string | null
}

export type FilterGroup = {
  id: string
  label: string
  options: FilterOption[]
  /** У макеті розгорнута лише «КАТЕГОРІЯ», решта груп згорнуті. */
  open?: boolean
}

export type FilterTrigger = {
  /** «ВСІ ФІЛЬТРИ» або «КАТЕГОРІЯ: ГОТОВІ ПРИКРАСИ», коли щось обрано. */
  label: string
  active: boolean
  /** Колір показуємо свотчем, а не назвою: «КОЛІР ●». */
  hex?: string | null
  /** Назва кольору для читачів екрана — сам свотч їм нічого не каже. */
  valueLabel?: string
}

/**
 * Прив'язка до макета. У магазину й курсів це різні кадри (30:114 і 161:4188),
 * тож номери вузлів приходять зі сторінки, а не зашиті в компонент — інакше
 * сторінка курсів успадкувала б магазинні id і знімок парності зламався б.
 */
export type FilterNodes = {
  row: string
  left: string
  right: string
  count: string
}

type Props = {
  triggers: FilterTrigger[]
  sortTrigger: FilterTrigger
  countLabel: string
  reset?: { href: string; label: string }
  title: string
  closeLabel: string
  applyLabel: string
  groups: FilterGroup[]
  nodes: FilterNodes
  /**
   * Відступ між мітками лівої групи. З макета: 28 у магазині (131:2736),
   * 24 на курсах (161:4189). Права група в обох — 20.
   */
  leftGap?: number
}

const LABEL =
  'text-eyebrow uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2'

/*
  Рядок керування каталогом (Figma 30:114) разом із шухлядою фільтрів
  («Фільтри» 131:2744 / «Фільтри — моб» 315:7499, панель 131:2990).

  Увесь рядок живе тут, а не на сторінці, і це навмисно: кожна мітка —
  і групи, і сортування — відкриває ту саму панель, тож вони мусять
  ділити один стан. Рознесені по різних контейнерах мітки цього не можуть.

  Десктоп: панель 400px біля ЛІВОГО краю поверх затемнення #0D0D0A 50%.
  Мобільний: повний екран без затемнення.

  Вибір лишається на URL-параметрах: кожен варіант — це посилання, яке додає
  або прибирає свій параметр. Клієнтський стан тут тільки на відкриття панелі
  та акордеон, тому фільтрація працює так само, як і без JS.
*/
export const FilterDrawer = ({
  triggers,
  sortTrigger,
  countLabel,
  reset,
  title,
  closeLabel,
  applyLabel,
  groups,
  nodes,
  leftGap = 28,
}: Props) => {
  const pathname = usePathname()
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string[]>(() =>
    groups.filter((group) => group.open).map((group) => group.id),
  )

  // Панель прив'язана до шляху, на якому її відкрили: перехід на інший маршрут
  // закриває її сам, а зміна параметрів фільтра — ні.
  const open = openedAt === pathname
  const close = () => setOpenedAt(null)
  const openPanel = () => setOpenedAt(pathname)

  /*
    Чи рядок зараз прилип. У CSS стану «sticky спрацював» немає, тож ставимо
    невидимий сентинел одразу над рядком і дивимось, коли він іде під шапку.
    IntersectionObserver, а не обробник прокручування: він не смикається на
    кожному кадрі й не змушує браузер перераховувати стилі.

    Зсув беремо з самого рядка — getComputedStyle розкриває var(--header-row)
    у пікселі, тож числа 60/80 не доводиться дублювати в JS. На зміну розміру
    вікна спостерігача перезбираємо: на мобільному шапка нижча.
  */
  const sentinel = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)

  useEffect(() => {
    const target = sentinel.current
    const barElement = bar.current
    if (!target || !barElement) return

    let observer: IntersectionObserver | null = null

    const attach = () => {
      observer?.disconnect()
      const offset = parseFloat(getComputedStyle(barElement).top) || 0
      observer = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), {
        rootMargin: `-${offset + 1}px 0px 0px 0px`,
      })
      observer.observe(target)
    }

    attach()
    window.addEventListener('resize', attach)
    return () => {
      observer?.disconnect()
      window.removeEventListener('resize', attach)
    }
  }, [])

  const toggleGroup = (id: string) =>
    setExpanded((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )

  const triggerButton = (item: FilterTrigger, key: string) => (
    <button
      key={key}
      type="button"
      onClick={openPanel}
      aria-expanded={open}
      className={`${LABEL} ${item.active ? 'text-ink hover:opacity-70' : 'text-muted hover:text-ink'}`}
    >
      {item.label}
      {item.hex && (
        <>
          <span
            aria-hidden="true"
            className="ml-2 inline-block h-3 w-3 rounded-full align-middle ring-1 ring-flax"
            style={{ background: item.hex }}
          />
          <span className="sr-only">: {item.valueLabel}</span>
        </>
      )}
    </button>
  )

  return (
    <>
      {/* Рядок прилипає одразу під шапкою, як на mejuri: у довгому каталозі
          фільтри мають лишатися під рукою. Через це йому потрібне власне тло —
          інакше крізь нього просвічували б картки.

          Тло й лінії — різної ширини, і це з макета:
          — тло на ВСЮ ширину екрана. Контейнер обмежений 1440 і відцентрований,
            тож на ширших моніторах смуга закінчувалась, і з-під липкого рядка
            з боків визирали картки;
          — лінії рівно по рядку. У макеті рядок 161:4188 має ширину 1360, а не
            1440, і смужки individualStrokeWeights {top:1, bottom:1} належать
            саме йому. Тобто лінія починається там, де «ВСІ ФІЛЬТРИ», і
            закінчується на «СОРТУВАННЯ» — під заголовком сторінки, а не в край
            екрана. Тому межа висить на внутрішньому блоці, всередині падінгів
            .shell, а не на самому .shell: на ньому вона захопила б і падінги.

          Колір лінії — не flax, а #16150F під 14%: на паперовому тлі це інший
          колір, і гейт парності ловить різницю (допуск 4 на канал). */}
      {/* Сентинел: 1px із від'ємним полем, тож на розкладку не впливає. */}
      <div ref={sentinel} aria-hidden="true" className="-mb-px h-px" />

      <div ref={bar} style={{ top: 'var(--header-row)' }} className="sticky z-40 w-full bg-paper">
        <div className="shell">
          {/* Коли рядок прилип, нижня лінія зникає: під ним і так уже їдуть
              картки, і зайва смуга різала б їх навпіл. Гасимо кольором, а не
              шириною, щоб нічого не здригнулось на 1px. */}
          <div
            data-figma-node={nodes.row}
            className={`flex flex-col gap-4 border-y border-t-ink/14 py-3.5 transition-colors duration-200 md:flex-row md:items-center md:justify-between ${
              stuck ? 'border-b-transparent' : 'border-b-ink/14'
            }`}
          >
            <div
              data-figma-node={nodes.left}
              className="flex flex-wrap items-center gap-y-3"
              style={{ columnGap: leftGap }}
            >
              {triggers.map((item) => triggerButton(item, item.label))}
              {reset && (
                <Link href={reset.href} className={`${LABEL} text-muted hover:text-ink`}>
                  {reset.label}
                </Link>
              )}
            </div>

            <div
              data-figma-node={nodes.right}
              className="flex flex-wrap items-center gap-x-5 gap-y-3"
            >
              <span data-figma-node={nodes.count} className={`${LABEL} text-muted`}>
                {countLabel}
              </span>
              {triggerButton(sortTrigger, 'sort')}
            </div>
          </div>
        </div>
      </div>

      <SideDrawer
        open={open}
        onClose={close}
        title={title}
        closeLabel={closeLabel}
        footer={
          <button
            type="button"
            onClick={close}
            className="mt-6 inline-flex h-11 shrink-0 items-center justify-center rounded-[2px] bg-ink px-8 text-[12px] font-semibold uppercase leading-[14.4px] tracking-[0.16em] text-paper transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {applyLabel}
          </button>
        }
      >
        {groups.map((group) => {
          const isOpen = expanded.includes(group.id)
          return (
            <div key={group.id} className="border-b border-ink/16 py-[18px]">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isOpen}
                className={`${LABEL} flex w-full items-center justify-between gap-3 text-ink hover:opacity-70`}
              >
                {group.label}
                <svg
                  viewBox="0 0 8 4"
                  aria-hidden="true"
                  className={`h-1 w-2 shrink-0 overflow-visible transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  fill="none"
                >
                  <path
                    d="M0 0L4 4L8 0"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {isOpen && (
                <div className="mt-4 flex flex-col gap-3.5">
                  {group.options.map((option) => (
                    <Link
                      key={option.href + option.label}
                      href={option.href}
                      scroll={false}
                      className="flex items-center gap-3 text-[13px] leading-[19.5px] text-ink transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2"
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-4 w-4 shrink-0 items-center justify-center border ${
                          option.checked ? 'border-ink bg-ink' : 'border-ink/16'
                        }`}
                        style={option.hex ? { background: option.hex } : undefined}
                      >
                        {option.hex && option.checked && (
                          <span className="h-2 w-2 border border-paper" />
                        )}
                      </span>
                      {option.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </SideDrawer>
    </>
  )
}
