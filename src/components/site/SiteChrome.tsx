'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, type ReactNode } from 'react'

import { CartDrawer } from '@/components/site/CartDrawer'
import { Footer } from '@/components/site/Footer'
import { Header } from '@/components/site/Header'
import { dictionary, type Locale } from '@/lib/i18n'
import type { Setting } from '@/payload-types'

type Props = {
  locale: Locale
  settings: Partial<Setting> | null
  children: ReactNode
}

/**
 * Вирішує, чи показувати глобальний chrome. Портал-splash («Головна — дві
 * гілки») іде без шапки й підвалу: лого в центрі саме працює хедером. Усі
 * гілки після розгалуження — з chrome.
 *
 * Рішення живе тут, у клієнтському компоненті, а не в layout, і це принципово.
 * Layout при клієнтській навігації НЕ перерендерюється («On navigation, layouts
 * preserve state, remain interactive, and do not rerender»), тому chrome
 * застигав таким, яким був на першому завантаженні: прийшов із каталогу на
 * головну — шапка лишалася, зайшов навпаки — її не було. usePathname()
 * оновлюється на кожному переході, тож стан більше не застрягає.
 */
export const SiteChrome = ({ locale, settings, children }: Props) => {
  const pathname = usePathname()
  const isPortal = pathname === '/' || pathname === '/en'

  /*
    Прокрутка на початок при переході.

    Next цього не робить: перша секція сторінок вища за екран, і його перевірка
    «чи видно верх нового блоку» вважає, що прокручувати нема потреби. Тому,
    перейшовши з середини каталогу в журнал, людина потрапляла не на початок
    сторінки, а кудись у її середину — над заголовком.

    Кнопка «назад» цього не зачіпає: там браузер повертає ту позицію, з якої
    пішли, і затирати її було б гірше за початкову ваду.
  */
  const wentBack = useRef(false)

  useEffect(() => {
    const onPop = () => {
      wentBack.current = true
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    if (wentBack.current) {
      wentBack.current = false
      return
    }
    /*
      `instant` обовʼязково. У html стоїть scroll-behavior: smooth — воно
      потрібне якорям усередині сторінки, але при переході перетворює стрибок
      на початок у повільний автоскрол через увесь документ. Саме його й видно
      як «сторінка сама кудись їде».

      Наступним кадром, а не одразу: Next теж чіпає прокрутку при переході, і
      з одного тіку ефекту наша команда губилась під його власною.
    */
    const frame = requestAnimationFrame(() =>
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' }),
    )
    return () => cancelAnimationFrame(frame)
  }, [pathname])

  /*
    key зі шляху — щоб проявлення повторювалось на кожному переході, а не лише
    при першому завантаженні. CSS-анімація запускається на появі елемента; без
    key React лишає той самий <main> і переграти її нічим.

    Шлях без параметрів запиту — навмисно: фільтри в каталозі міняють лише їх,
    і блимати сіткою товарів на кожну галочку не треба.
  */
  if (isPortal)
    return (
      <main key={pathname} className="show-slow">
        {children}
      </main>
    )

  const t = dictionary(locale)

  return (
    <>
      {/* Промо-смуга — верхній поверх самої шапки, як у макеті, тому йде
          всередину Header, а не окремим блоком над ним. */}
      <Header locale={locale} announcement={settings?.announcement} />
      <main key={pathname} className="show-slow">
        {children}
      </main>
      <Footer settings={settings} t={t} />
      <CartDrawer freeDeliveryFrom={settings?.freeDeliveryFrom} />
    </>
  )
}
