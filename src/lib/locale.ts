import { headers } from 'next/headers'

import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n'

/*
  Мову кладе middleware в заголовок запиту — окремого дерева сторінок під /en
  немає. Наслідок: сторінка, що викликає getLocale, НЕ може бути
  `force-static`. Статичну збирають один раз під час білду, заголовка тоді ще
  не існує, getLocale падає на DEFAULT_LOCALE — і /en/shop віддає той самий
  український HTML, що й /shop. Локально це непомітно: у dev усе рендериться
  на запит, тож баг живе тільки в проді.

  Тому кожна сторінка, яка читає мову, стоїть на `force-dynamic`.
*/

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
