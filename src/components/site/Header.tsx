'use client'

import { Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import Image from 'next/image'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { plural } from '@/lib/format'
import { dictionary, LOCALES, localePath, type Locale } from '@/lib/i18n'
import { useScrollLock } from '@/lib/useScrollLock'
import { useCart } from '@/providers/CartProvider'

type Props = {
  locale: Locale
  /**
   * Текст промо-смуги. У макеті вона — верхній поверх самої шапки («Смуга»
   * 1440×40), а не окремий блок над нею, тому приходить сюди пропом.
   */
  announcement?: string | null
}

const LOCALE_LABELS: Record<Locale, string> = { uk: 'UA', en: 'EN' }

/*
  Шапка за макетом (Figma «Шапка» 18:2 / «Шапка / Мобільна» 301:2).

  Два поверхи: темна «Смуга» з промо-написом (40px на десктопі, 36 на мобільному)
  і «Ряд» із навігацією, лого й діями (80 / 60). Разом 120 і 96.

  Прилипає при прокручуванні лише «Ряд», через sticky, а не fixed. Промо-смуга
  лишається в потоці й їде вгору — так це працює на mejuri, і так шапка не
  накриває верх сторінки, поки її не прокрутили.
*/
export const Header = ({ locale, announcement }: Props) => {
  // Словник збираємо тут, а не приймаємо пропом: у ньому є функції,
  // а їх не можна передати із серверного компонента в клієнтський.
  const t = dictionary(locale)
  const currentPath = usePathname()
  // Шлях без мовного префікса: перемикач мов має лишати вас на тій самій
  // сторінці. Беремо його з роутера, а не з заголовка запиту — інакше на
  // статичних сторінках значення порожнє, а при переходах застаріле.
  const barePath = currentPath.replace(/^\/en(?=\/|$)/, '') || '/'
  const { count, open } = useCart()

  // Меню прив'язане до шляху, на якому його відкрили: щойно користувач кудись
  // перейшов, воно закривається саме собою. Так стан виводиться зі шляху,
  // а не дописується ефектом навздогін.
  const [openedAt, setOpenedAt] = useState<string | null>(null)
  const menuOpen = openedAt === currentPath

  const sheetRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  /*
    Закриваючи меню, повертаємо фокус на бургер — туди, звідки його відкрили.
    Інакше після Esc фокус падає в <body>, і наступний Tab починає обхід
    сторінки спочатку.

    Наступним кадром, а не одразу: поки меню відкрите, шапка має `inert`, і
    focus() на елементі всередині неї просто нічого не робить. До rAF React
    встигає зняти атрибут.
  */
  const restoreFocus = () => requestAnimationFrame(() => burgerRef.current?.focus())

  const closeMenu = () => {
    setOpenedAt(null)
    restoreFocus()
  }

  useScrollLock(menuOpen)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpenedAt(null)
      requestAnimationFrame(() => burgerRef.current?.focus())
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /*
    Поки аркуш меню відкритий, решта сторінки виходить і з таб-порядку, і з
    дерева доступності. Це повноекранний шар: за ним нічого не видно, а Tab
    досі вів у шапку й далі в сторінку під ним.

    Запамʼятовуємо, у кого `inert` уже стояв, і повертаємо як було: шухляда
    кошика — теж сусід по body, і знімати з неї атрибут наосліп не можна.
  */
  useEffect(() => {
    if (!menuOpen) return

    const siblings = [...document.body.children].filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== sheetRef.current,
    )
    const had = siblings.map((element) => element.hasAttribute('inert'))
    siblings.forEach((element) => element.setAttribute('inert', ''))

    closeRef.current?.focus()

    return () => {
      siblings.forEach((element, index) => {
        if (!had[index]) element.removeAttribute('inert')
      })
    }
  }, [menuOpen])

  /*
    Чотири розділи мобільного меню (302:4484). Ідентифікатори вузлів лежать
    поруч із посиланнями, а не в окремій таблиці: рядків усього чотири, і так
    видно, що чому відповідає.
  */
  const sections = [
    { href: '/shop', title: t.nav.finished, node: '302:4485', titleNode: '302:4486', arrowNode: '302:4487' },
    { href: '/courses', title: t.nav.learn, node: '302:4489', titleNode: '302:4490', arrowNode: '302:4491' },
    { href: '/journal', title: t.nav.journal, node: '302:4493', titleNode: '302:4494', arrowNode: '302:4495' },
    { href: '/about', title: t.nav.about, node: '302:4497', titleNode: '302:4498', arrowNode: '302:4499' },
  ]

  /*
    У макеті «UA / EN» — один напис кольором --color-muted (I155:3527;18:9),
    без притемнення неактивної мови. Ми ділимо його на посилання, але колір
    лишаємо той самий: opacity-60 давала #A6A39E на папері, тобто контраст
    2.38 замість потрібних 4.5 — axe справедливо лаявся. Активну мову
    показуємо чорнилом, а не яскравістю.
  */
  const languageSwitch = (
    <span className="flex items-center gap-1.5 text-eyebrow text-muted">
      {LOCALES.map((option, index) => (
        <span key={option} className="flex items-center gap-1.5">
          {index > 0 && <span aria-hidden="true">/</span>}
          {option === locale ? (
            <span aria-current="true" className="text-ink">
              {LOCALE_LABELS[option]}
            </span>
          ) : (
            <NextLink
              href={localePath(option, barePath)}
              className="transition-colors hover:text-ink active:text-ink/70"
            >
              {LOCALE_LABELS[option]}
            </NextLink>
          )}
        </span>
      ))}
    </span>
  )

  const logo = (
    <Link
      href="/"
      aria-label={t.header.home}
      className="shrink-0 transition-opacity hover:opacity-60 active:opacity-40"
    >
      <Image
        src="/home/logo.png"
        alt="STAN_UA market"
        width={222}
        height={63}
        priority
        unoptimized
        className="h-[30px] w-[108px] md:h-9 md:w-32"
      />
    </Link>
  )

  return (
    <>
      {/*
        Липка шапка, як на mejuri: промо-смуга їде вгору, рядок із логотипом
        лишається. Зроблено одним sticky на всій шапці зі зсувом угору на
        висоту смуги (36 / 40) — тоді смуга виходить за верх екрана, а рядок
        пришпилюється рівно до нуля.

        Липким мусить бути саме <header>, а не рядок усередині: sticky працює
        лише в межах батьківського блоку, тож рядок усередині 120-піксельної
        шапки відклеювався б одразу. Тут батько — <body>, і висоти вистачає.
      */}
      <header
        data-sticky-header
        className={`sticky z-50 bg-paper ${announcement ? '-top-9 md:-top-10' : 'top-0'}`}
      >
        {announcement && (
          <div className="bg-ink">
            <p className="shell flex h-9 items-center justify-center text-center text-eyebrow uppercase text-paper md:h-10">
              {announcement}
            </p>
          </div>
        )}

        <div className="border-b border-flax bg-paper">
          <div className="shell flex h-[60px] items-center justify-between gap-4 md:h-20">
            <div className="flex flex-1 items-center">
              <button
                type="button"
                ref={burgerRef}
                onClick={() => setOpenedAt(currentPath)}
                data-testid="menu-button"
                className="-ml-1 p-1 transition-opacity hover:opacity-60 active:opacity-40 md:hidden"
                aria-label={t.header.menu}
                aria-expanded={menuOpen}
              >
                <Menu strokeWidth={1.25} className="size-[22px]" />
              </button>

              <nav className="hidden items-center gap-7 md:flex">
                <Link href="/" className="thread-link text-[13px] leading-[19.5px]">
                  {t.nav.home}
                </Link>
                <Link href="/journal" className="thread-link text-[13px] leading-[19.5px]">
                  {t.nav.journal}
                </Link>
                <Link href="/about" className="thread-link text-[13px] leading-[19.5px]">
                  {t.nav.about}
                </Link>
              </nav>
            </div>

            {logo}

            <div className="flex flex-1 items-center justify-end gap-[18px]">
              <span className="hidden md:block">{languageSwitch}</span>
              <Link href="/search" aria-label={t.header.search} className="hidden md:block">
                <Search strokeWidth={1.25} className="size-5" />
              </Link>
              <Link href="/account" aria-label={t.header.account} className="hidden md:block">
                <User strokeWidth={1.25} className="size-5" />
              </Link>
              <button
                type="button"
                onClick={open}
                data-testid="cart-button"
                className="relative"
                aria-label={`${t.header.cart}, ${
                  locale === 'uk'
                    ? plural(count, 'позиція', 'позиції', 'позицій')
                    : `${count} items`
                }`}
              >
                <ShoppingBag strokeWidth={1.25} className="size-[22px] md:size-5" />
                {count > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo px-1 font-display text-[0.5625rem] text-paper">
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/*
        Мобільне меню за макетом (302:4424). Це повноекранний аркуш кольору
        паперу, а не бічна шухляда: затемнення під ним нема чому показувати,
        бо сторінки за ним не видно.

        Кадр намальовано ЛИШЕ на 390 — на десктопі вся навігація живе в самій
        шапці, тож меню там не існує. Це стан, специфічний для пристрою: другої
        ширини для попіксельного звіряння в дизайні немає й не має бути.

        Розділів рівно чотири, як у макеті. Напрями курсів і підрозділи
        магазину, що були в старій шухляді, звідси прибрані — до них ведуть
        «Навчання» й «Готові вироби».
      */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.header.menu}
        data-figma-node="302:4424"
        data-figma-state="menu-open"
        className={`fixed inset-0 z-60 flex flex-col overflow-y-auto bg-paper transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
          menuOpen ? 'translate-x-0' : 'pointer-events-none -translate-x-full'
        }`}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div
          data-figma-node="302:4425"
          className="flex h-[60px] shrink-0 items-center justify-between px-4"
        >
          {/* -m/p: сам хрестик 20×20, як намальовано, а зона натискання 40 —
              у 20 px пальцем не влучити (WCAG 2.5.8 просить від 24). */}
          <button
            type="button"
            ref={closeRef}
            onClick={closeMenu}
            aria-label={t.header.closeMenu}
            className="-m-3.5 p-3.5 transition-opacity hover:opacity-60 active:opacity-40"
          >
            {/*
              Вузол макета — на коробці 20×20, а не на кнопці: у макеті це
              саме іконка, а 48 px навколо неї — зона натискання, якої там
              не намальовано.

              strokeWidth 1.2 при size-7: у lucide хрестик займає 12 із 24
              одиниць коробки, тож на 28 px він виходить 14×14 з обведенням
              1.4 — рівно як у макеті (302:4427).
            */}
            <span
              data-figma-node="302:4426"
              className="flex size-5 items-center justify-center"
            >
              <X strokeWidth={1.2} className="size-7" />
            </span>
          </button>

          <span data-figma-node="302:4428">{logo}</span>

          {/* «Місце» з макета: порожній квадрат, який тримає лого по центру. */}
          <span data-figma-node="302:4483" aria-hidden="true" className="size-5" />
        </div>

        <nav data-figma-node="302:4484" aria-label={t.header.menu} className="px-4 pt-6">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              data-figma-node={section.node}
              className="flex items-center justify-between border-b border-hairline py-5 transition-opacity hover:opacity-60 active:opacity-40"
            >
              <span
                data-figma-node={section.titleNode}
                className="font-display text-[17px] font-normal leading-[22px] tracking-[-0.005em] text-ink"
              >
                {section.title}
              </span>
              {/* Стрілка з макета (302:4488) — 12×9 в коробці 18. У lucide
                  вона квадратна 14×14, тобто з помітно вищим вістрям. */}
              <span
                data-figma-node={section.arrowNode}
                className="flex size-[18px] items-center justify-center"
              >
                <svg viewBox="0 0 12 9" fill="none" aria-hidden="true" className="w-3">
                  <path
                    d="M0.6 4.5h10.8M7.4 0.6 11.4 4.5 7.4 8.4"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
          ))}
        </nav>

        {/* -my/py: рядки 20 px заввишки стоять за 18 один від одного, тож зона
            натискання 36 лишає між ними 2 px і нікуди не зсуває сам текст. */}
        <div data-figma-node="302:4501" className="flex flex-col gap-[18px] px-4 pt-7">
          <Link
            href="/account"
            data-figma-node="302:4502"
            className="-my-2 self-start py-2 text-[13px] leading-5 text-ink transition-opacity hover:opacity-60 active:opacity-40"
          >
            {t.account.tabs.access}
          </Link>
          <Link
            href="/account/saved"
            data-figma-node="302:4503"
            className="-my-2 self-start py-2 text-[13px] leading-5 text-ink transition-opacity hover:opacity-60 active:opacity-40"
          >
            {t.account.tabs.saved}
          </Link>
          {/* Кошик — не сторінка, а та сама шухляда, що й з іконки в шапці.
              Меню при цьому закриваємо, інакше воно лишиться під нею. */}
          <button
            type="button"
            data-figma-node="302:4504"
            onClick={() => {
              closeMenu()
              open()
            }}
            className="-my-2 self-start py-2 text-[13px] leading-5 text-ink transition-opacity hover:opacity-60 active:opacity-40"
          >
            {t.cart.title}
          </button>
        </div>

        <div data-figma-node="302:4505" className="flex items-center gap-6 px-4 pt-8">
          <span data-figma-node="302:4506">{languageSwitch}</span>
          <Link
            href="/search"
            data-figma-node="302:4507"
            /* -me: CSS додає міжлітерний інтервал і після останньої літери,
               Figma — ні, тож без цього напис на 1.76 px ширший за макетний. */
            className="-me-[0.16em] text-eyebrow uppercase text-muted transition-colors hover:text-ink active:text-ink/70"
          >
            {t.header.search}
          </Link>
        </div>
      </div>
    </>
  )
}
