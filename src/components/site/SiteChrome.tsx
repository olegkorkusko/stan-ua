'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

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

  if (isPortal) return <main>{children}</main>

  const t = dictionary(locale)

  return (
    <>
      {/* Промо-смуга — верхній поверх самої шапки, як у макеті, тому йде
          всередину Header, а не окремим блоком над ним. */}
      <Header locale={locale} announcement={settings?.announcement} />
      <main>{children}</main>
      <Footer settings={settings} t={t} />
      <CartDrawer />
    </>
  )
}
