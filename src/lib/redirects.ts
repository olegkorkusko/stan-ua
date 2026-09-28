/*
  Перенаправлення зі старих сайтів на Weblium.

  Навіщо: посилання вже розійшлись по Instagram, візитках і пошуку Google. Без
  301-редіректу вони дадуть 404 — і накопичена вага сторінок у Google
  втратиться замість того, щоб перейти на новий сайт.

  Адреси зняті з усіх пʼяти сайтів: mk, 2rsnb, stanua, bfutc і stan-ua. Шляхи в
  них збігаються, бо всі зроблені з одного шаблону.

  Чого цей файл НЕ вміє: він спрацьовує лише на нашому домені. Той, хто відкриє
  mk.weblium.site, сюди не потрапить узагалі — перенаправлення з чужого домену
  налаштовується на боці Weblium або зняттям тих сайтів. Тут ми ловимо тих, хто
  прийде за старим шляхом уже на stanua.com.ua: із закладки, з переписки, або
  коли клієнтка перенесе на нас свій домен.
*/
export const REDIRECTS: Record<string, string> = {
  '/pitannya-ta-vidpovidi': '/faq',
  '/oplata': '/delivery',
  '/publichna-oferta': '/offer',
  '/politika-konfidenciynosti': '/privacy',

  /*
    Сторінки покупки МК. На трьох різних сайтах вони звуться однаково, а вели
    на різні майстер-класи — з самого шляху не зрозуміти, який саме потрібен.
    Тому ведемо в каталог курсів: людина бачить усі й обирає свій.
  */
  '/pridbati-mayster-klas': '/courses/catalog',
  '/pridbati-mayster-klas-1': '/courses/catalog',
  '/pridbati-mayster-klas-2': '/courses/catalog',
}

/** Точний збіг шляху, без урахування кінцевої скісної риски й регістру. */
export const findRedirect = (pathname: string): string | undefined => {
  const normalised = pathname.replace(/\/+$/, '').toLowerCase() || '/'
  return REDIRECTS[normalised]
}
