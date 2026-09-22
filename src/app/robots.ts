import type { MetadataRoute } from 'next'

import { siteSettings } from '@/lib/settings'

const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

/*
  Без цього Next збирає robots.txt один раз і більше до бази не заглядає:
  галочку в адмінці зняли, мета-тег на сторінках змінився, а robots.txt далі
  запрошує пошуковиків. Один запит до бази на звернення — ціна невелика, сюди
  ходять роботи, не люди.
*/
export const dynamic = 'force-dynamic'

/*
  Галочка «Дозволити пошуковикам індексувати сайт» керує і цим файлом, і
  мета-тегом robots у layout.

  Одного мета-тега мало: щоб його побачити, пошуковик має спершу завантажити
  сторінку, а robots.txt він читає до того. Поки сайт наповнюють, краще щоб
  не заходив узагалі.
*/
const robots = async (): Promise<MetadataRoute.Robots> => {
  const settings = await siteSettings('uk')

  if (settings?.searchVisible === false) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Кабінет, кошик і службові маршрути в пошуку не потрібні.
      disallow: ['/admin', '/api', '/account', '/checkout', '/search'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}

export default robots
