import { headers } from 'next/headers'

import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n'

/** Мова поточного запиту. Її кладе middleware. */
export const getLocale = async (): Promise<Locale> => {
  const value = (await headers()).get('x-locale')
  return isLocale(value) ? value : DEFAULT_LOCALE
}

/** Шлях без мовного префікса — потрібен перемикачу мов. */
export const getPathname = async (): Promise<string> => {
  const value = (await headers()).get('x-pathname') ?? '/'
  return value.replace(/^\/en/, '') || '/'
}
