/**
 * Перенаправлення зі старого сайту mk.weblium.site.
 *
 * Навіщо: посилання на старі сторінки вже розійшлись по Instagram, візитках і
 * пошуку Google. Без 301-редіректу вони дадуть 404 — і накопичена вага
 * сторінок у Google втратиться замість того, щоб перейти на новий сайт.
 *
 * Адреси зняті з mk.weblium.site. Якщо після перенесення знайдуться ще —
 * дописати сюди: рядок у цьому файлі дешевший за втрачений трафік.
 */
export const REDIRECTS: Record<string, string> = {
  '/pitannya-ta-vidpovidi': '/faq',
  '/oplata': '/delivery',
  '/publichna-oferta': '/offer',
  '/politika-konfidenciynosti': '/privacy',
}

/** Точний збіг шляху, без урахування кінцевої скісної риски й регістру. */
export const findRedirect = (pathname: string): string | undefined => {
  const normalised = pathname.replace(/\/+$/, '').toLowerCase() || '/'
  return REDIRECTS[normalised]
}
