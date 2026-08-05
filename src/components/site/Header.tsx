'use client'

import { Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { plural } from '@/lib/format'
import { dictionary, LOCALES, localePath, type Locale } from '@/lib/i18n'
import { useCart } from '@/providers/CartProvider'

export type NavDirection = { title: string; slug: string }

type Props = {
  directions: NavDirection[]
  locale: Locale
  /** Шлях без мовного префікса: перемикач мов має лишати вас на тій самій сторінці. */
  pathname: string
}

const LOCALE_LABELS: Record<Locale, string> = { uk: 'UA', en: 'EN' }

export const Header = ({ directions, locale, pathname }: Props) => {
  // Словник збираємо тут, а не приймаємо пропом: у ньому є функції,
  // а їх не можна передати із серверного компонента в клієнтський.
  const t = dictionary(locale)
  const currentPath = usePathname()
  const { count, open } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const shopLinks = [
    { href: '/shop', title: t.nav.allProducts },
    { href: '/shop?category=prykrasy', title: locale === 'uk' ? 'Готові прикраси' : 'Ready jewellery' },
    { href: '/shop?category=nabory', title: locale === 'uk' ? 'Набори для створення' : 'Make-it-yourself kits' },
  ]

  const infoLinks = [
    { href: '/about', title: t.footer.links.about },
    { href: '/delivery', title: t.footer.links.delivery },
    { href: '/journal', title: t.footer.links.journal },
  ]

  // На головній шапка лежить поверх фонового зображення й світиться білим,
  // поки сторінку не прокрутили.
  const isHome = currentPath === '/' || currentPath === '/en'
  const overlay = isHome && !scrolled && !menuOpen

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => setMenuOpen(false), [currentPath])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const languageSwitch = (
    <span className="flex items-center gap-1.5 text-[0.6875rem] tracking-[0.16em]">
      {LOCALES.map((option, index) => (
        <span key={option} className="flex items-center gap-1.5">
          {index > 0 && <span className="opacity-30">/</span>}
          {option === locale ? (
            <span aria-current="true">{LOCALE_LABELS[option]}</span>
          ) : (
            <NextLink href={localePath(option, pathname)} className="opacity-60 hover:opacity-100">
              {LOCALE_LABELS[option]}
            </NextLink>
          )}
        </span>
      ))}
    </span>
  )

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
          overlay ? 'text-paper' : 'border-b border-flax bg-paper/95 text-ink backdrop-blur'
        }`}
      >
        <div className="shell flex h-16 items-center justify-between gap-4 md:h-20">
          <div className="flex flex-1 items-center gap-7">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="-ml-1 p-1 lg:hidden"
              aria-label={t.header.menu}
              aria-expanded={menuOpen}
            >
              <Menu strokeWidth={1.25} size={22} />
            </button>

            <nav className="hidden items-center gap-7 lg:flex">
              <Link href="/courses" className="thread-link text-[0.8125rem]">
                {t.nav.courses}
              </Link>
              <Link href="/shop" className="thread-link text-[0.8125rem]">
                {t.nav.shop}
              </Link>
              <Link href="/about" className="thread-link text-[0.8125rem]">
                {t.nav.about}
              </Link>
            </nav>
          </div>

          <Link href="/" aria-label={t.header.home} className="font-display text-lg tracking-[0.3em] md:text-xl">
            МК
          </Link>

          <div className="flex flex-1 items-center justify-end gap-4 md:gap-5">
            <span className="hidden md:block">{languageSwitch}</span>
            <Link href="/search" aria-label={t.header.search} className="hidden p-1 md:block">
              <Search strokeWidth={1.25} size={19} />
            </Link>
            <Link href="/account" aria-label={t.header.account} className="p-1">
              <User strokeWidth={1.25} size={19} />
            </Link>
            <button
              type="button"
              onClick={open}
              className="relative p-1"
              aria-label={`${t.header.cart}, ${
                locale === 'uk' ? plural(count, 'позиція', 'позиції', 'позицій') : `${count} items`
              }`}
            >
              <ShoppingBag strokeWidth={1.25} size={19} />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo px-1 font-display text-[0.5625rem] text-paper">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Бічна панель меню. Відкривається зліва, як на mejuri. */}
      <div
        className={`fixed inset-0 z-60 lg:hidden ${menuOpen ? '' : 'pointer-events-none'}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label={t.header.closeMenu}
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-ink/30 transition-opacity duration-400 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-[min(23rem,88vw)] flex-col bg-paper transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-flax px-5">
            <span className="font-display text-base tracking-[0.3em]">МК</span>
            <div className="flex items-center gap-5">
              {languageSwitch}
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label={t.header.closeMenu}
                className="p-1"
              >
                <X strokeWidth={1.25} size={22} />
              </button>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-5 py-7">
            <p className="label">{t.nav.courses}</p>
            <ul className="mt-3 space-y-3">
              {directions.map((direction) => (
                <li key={direction.slug}>
                  <Link href={`/courses/${direction.slug}`} className="font-display text-2xl">
                    {direction.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/courses" className="thread-link text-sm text-muted">
                  {t.nav.allCourses}
                </Link>
              </li>
            </ul>

            <hr className="thread my-7" />

            <p className="label">{t.nav.shop}</p>
            <ul className="mt-3 space-y-3">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[0.9375rem]">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>

            <hr className="thread my-7" />

            <ul className="space-y-3">
              {infoLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[0.9375rem] text-muted">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  )
}
