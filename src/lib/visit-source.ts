/**
 * Звідки прийшов покупець — знімається при першому заході й живе до оформлення.
 *
 * Чому при ПЕРШОМУ, а не при оформленні: людина заходить із реклами, гуляє
 * каталогом, за день повертається й купує. Якби ми питали джерело в момент
 * «оформити», відповіддю був би наш власний кошик — тобто ніщо. Тому мітки
 * відкладаємо на першому ж кроці й більше не чіпаємо.
 *
 * Чому sessionStorage, а не localStorage: джерело має жити стільки, скільки
 * живе візит. Збережене назавжди, воно приписало б рекламі всі наступні
 * покупки того самого покупця, зокрема й прямі заходи через місяць.
 *
 * Чому не cookie: ці дані ми шлемо самі в момент оформлення, серверу вони
 * між запитами не потрібні, а зайва cookie — це ще один рядок у банері.
 */

const KEY = 'mk.source.v1'

export type VisitSource = {
  utmSource?: string
  utmCampaign?: string
  referrer?: string
}

const clean = (value: string | null | undefined): string | undefined => {
  const trimmed = value?.trim().slice(0, 120)
  return trimmed || undefined
}

/** Запамʼятовує джерело, якщо воно ще не запамʼятоване. Повертає збережене. */
export const rememberSource = (): VisitSource => {
  if (typeof window === 'undefined') return {}

  try {
    const stored = window.sessionStorage.getItem(KEY)
    if (stored) return JSON.parse(stored) as VisitSource

    const params = new URLSearchParams(window.location.search)
    // Зовнішній перехід: своє ж посилання джерелом не вважаємо, інакше
    // кожна друга сторінка писала б «stanua.com.ua».
    const from = document.referrer
    const external = from && !from.startsWith(window.location.origin) ? from : undefined

    const source: VisitSource = {
      utmSource: clean(params.get('utm_source')),
      utmCampaign: clean(params.get('utm_campaign')),
      referrer: clean(external),
    }

    window.sessionStorage.setItem(KEY, JSON.stringify(source))
    return source
  } catch {
    // Приватне вікно або заблоковане сховище — працюємо без джерела.
    return {}
  }
}
