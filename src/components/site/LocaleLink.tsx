'use client'

import NextLink from 'next/link'
import { createContext, useContext, type ComponentProps, type ReactNode } from 'react'

import { DEFAULT_LOCALE, localePath, type Locale } from '@/lib/i18n'

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE)

export const LocaleProvider = ({ locale, children }: { locale: Locale; children: ReactNode }) => (
  <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
)

export const useLocale = () => useContext(LocaleContext)

/**
 * Заміна next/link, яка сама тримає відвідувача в його мові: на англійській
 * версії всі внутрішні посилання отримують префікс /en. Зовнішні адреси,
 * якорі та вже префіксовані шляхи лишаються як є.
 */
export const LocaleLink = ({ href, ...props }: ComponentProps<typeof NextLink>) => {
  const locale = useLocale()

  if (typeof href !== 'string') return <NextLink href={href} {...props} />
  if (/^(https?:|mailto:|tel:|#)/.test(href) || href.startsWith('/en')) {
    return <NextLink href={href} {...props} />
  }

  return <NextLink href={localePath(locale, href)} {...props} />
}
