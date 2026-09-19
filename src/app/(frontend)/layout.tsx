import type { Metadata } from 'next'
import { Manrope, Unbounded } from 'next/font/google'

import { Analytics } from '@/components/site/Analytics'
import { LocaleProvider } from '@/components/site/LocaleLink'
import { SiteChrome } from '@/components/site/SiteChrome'
import { getLocale } from '@/lib/locale'
import { payloadClient } from '@/lib/payload'
import { CartProvider } from '@/providers/CartProvider'

import './globals.css'

/*
  Unbounded — українська геометрична гротеска. Використовується дозовано:
  заголовки, ціни, логотип. Manrope тримає весь інший текст.
  Свідомо без каліграфічної антикви — вона перетворює будь-який хендмейд-бренд
  на такий самий, як усі інші.
*/
const unbounded = Unbounded({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  variable: '--font-unbounded',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'МК — прикраси ручної роботи та майстер-класи',
    template: '%s · МК',
  },
  description:
    'Вʼязання, бісероплетіння, макраме: курси з доступом назавжди і прикраси ручної роботи. Доставка Новою Поштою по Україні.',
  openGraph: { type: 'website', locale: 'uk_UA', siteName: 'МК' },
}

/*
  Напрями курсів звідси прибрані разом зі старою шухлядою меню: у макеті
  мобільного меню (302:4484) рівно чотири розділи, напрямів серед них немає.
  Список тягнувся запитом до Payload на КОЖНОМУ рендері будь-якої сторінки —
  і жодна з них його вже не показувала.
*/
const loadChrome = async (locale: Awaited<ReturnType<typeof getLocale>>) => {
  const payload = await payloadClient()
  const settings = await payload
    .findGlobal({ locale, slug: 'settings', depth: 0 })
    .catch(() => null)
  return { settings }
}

// Дані для chrome тягнемо завжди, навіть для порталу, де він не показується.
// Раніше їх пропускали за поточним шляхом, але шлях тут читався із заголовка
// запиту — а це не працює двічі: на статичних сторінках заголовків немає
// взагалі, і layout не перерендерюється при переходах. Ціна рішення — один
// запит до Payload на порталі; показувати chrome чи ні, вирішує SiteChrome.
const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const locale = await getLocale()
  const chrome = await loadChrome(locale)

  return (
    <html lang={locale} className={`${unbounded.variable} ${manrope.variable}`}>
      <body className="min-h-screen">
        <LocaleProvider locale={locale}>
          <CartProvider>
            <SiteChrome locale={locale} settings={chrome.settings}>
              {children}
            </SiteChrome>
            <Analytics ga={process.env.NEXT_PUBLIC_GA_ID} pixel={process.env.NEXT_PUBLIC_META_PIXEL_ID} />
          </CartProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}

export default RootLayout
