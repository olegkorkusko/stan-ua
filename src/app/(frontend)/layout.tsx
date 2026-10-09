import type { Metadata } from 'next'
import { Manrope, Unbounded } from 'next/font/google'

import { Analytics } from '@/components/site/Analytics'
import { LocaleProvider } from '@/components/site/LocaleLink'
import { SiteChrome } from '@/components/site/SiteChrome'
import { getLocale } from '@/lib/locale'
import { imageUrl } from '@/lib/media'
import { siteSettings } from '@/lib/settings'
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

const DEFAULT_TITLE = 'STAN_UA — прикраси ручної роботи та майстер-класи'
const DEFAULT_DESCRIPTION =
  'Вʼязання, бісероплетіння, макраме: курси з доступом назавжди і прикраси ручної роботи. Доставка Новою Поштою по Україні.'

/*
  Заголовок, опис і картинка для соцмереж беруться з «Налаштувань сайту», а
  коди лічильників і заборона індексації — звідти ж. Тексти з коду лишаються
  запасним варіантом: поки клієнтка не заповнила поле, сайт виглядає в пошуку
  так само, як раніше, а не порожньо.

  Окремі заголовки конкретних сторінок це не перебиває — вони мають власний
  блок «SEO» і підставляються через шаблон «%s · STAN_UA».
*/
export const generateMetadata = async (): Promise<Metadata> => {
  const locale = await getLocale()
  const settings = await siteSettings(locale)
  const image = imageUrl(settings?.seoImage, 'wide')

  return {
    /*
      Адреси медіа відносні (/api/media/file/...) — так їх бачить next/image,
      і так їх має бачити оптимізатор. Але у превʼю для соцмереж відносного
      шляху не досить: Facebook і Telegram тягнуть картинку з нуля й не знають,
      від чого її відраховувати. metadataBase — те, від чого Next розгортає
      будь-який відносний шлях у метаданих: тут і нижче в журналі та сторінках.
    */
    metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'),
    title: { default: settings?.seoTitle || DEFAULT_TITLE, template: '%s · STAN_UA' },
    description: settings?.seoDescription || DEFAULT_DESCRIPTION,
    openGraph: {
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'uk_UA',
      siteName: 'STAN_UA',
      ...(image ? { images: [image] } : {}),
    },
    // Галочка знята — сайт закритий від пошуку, поки його наповнюють.
    ...(settings?.searchVisible === false ? { robots: { index: false, follow: false } } : {}),
    /*
      Підтвердження права на домен: Google бере код з адмінки, Meta — звідси.

      Код Meta лишається в коді навмисно. Його видають один раз при додаванні
      домену в Business Settings, він більше ніколи не міняється, і секретом
      не є — він і так лежить у розмітці кожної сторінки. Заводити заради
      нього поле в адмінці й міграцію бази означало б більше роботи, ніж
      користі.

      Навіщо взагалі: без підтвердженого домену Meta не зараховує рекламі
      покупки з iPhone — Apple вимагає, щоб домен належав рекламодавцю.
    */
    verification: {
      ...(settings?.googleVerification ? { google: settings.googleVerification } : {}),
      other: { 'facebook-domain-verification': '7lh29a3wsibpy7gf6zowzq7o9bsz7p' },
    },
  }
}

// Дані для chrome тягнемо завжди, навіть для порталу, де він не показується.
// Раніше їх пропускали за поточним шляхом, але шлях тут читався із заголовка
// запиту — а це не працює двічі: на статичних сторінках заголовків немає
// взагалі, і layout не перерендерюється при переходах. Ціна рішення — один
// запит до Payload на порталі; показувати chrome чи ні, вирішує SiteChrome.
const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const locale = await getLocale()
  const settings = await siteSettings(locale)

  return (
    <html lang={locale} className={`${unbounded.variable} ${manrope.variable}`}>
      <body className="min-h-screen">
        <LocaleProvider locale={locale}>
          <CartProvider>
            <SiteChrome locale={locale} settings={settings}>
              {children}
            </SiteChrome>
            {/*
              Коди лічильників — з адмінки, змінні оточення лишаються запасним
              варіантом. Інакше клієнтка не може під'єднати аналітику сама:
              NEXT_PUBLIC_* запікаються в збірку, тож кожна правка означала б
              деплой.
            */}
            <Analytics
              ga={settings?.gaId || process.env.NEXT_PUBLIC_GA_ID}
              pixel={settings?.metaPixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID}
            />
          </CartProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}

export default RootLayout
