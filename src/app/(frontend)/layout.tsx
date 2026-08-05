import type { Metadata } from 'next'
import { Manrope, Unbounded } from 'next/font/google'

import { CartDrawer } from '@/components/site/CartDrawer'
import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
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

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const payload = await payloadClient()

  const [directions, settings] = await Promise.all([
    payload
      .find({
        collection: 'course-directions',
        limit: 12,
        sort: 'order',
        depth: 0,
      })
      .catch(() => ({ docs: [] })),
    payload.findGlobal({ slug: 'settings', depth: 0 }).catch(() => null),
  ])

  const navDirections = directions.docs.map((doc) => ({
    title: doc.title,
    slug: doc.slug ?? '',
  }))

  return (
    <html lang="uk" className={`${unbounded.variable} ${manrope.variable}`}>
      <body className="min-h-screen">
        <CartProvider>
          {settings?.announcement && (
            <p className="bg-indigo px-4 py-2 text-center text-[0.6875rem] uppercase tracking-[0.16em] text-paper">
              {settings.announcement}
            </p>
          )}
          <Header directions={navDirections} />
          <main>{children}</main>
          <Footer settings={settings} />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  )
}

export default RootLayout
