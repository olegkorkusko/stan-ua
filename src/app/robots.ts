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
      /*
        Лише адмінка й службовий API. Кабінет, кошик і пошук звідси НЕ
        прибирати назад — це вже коштувало нам попередження в Search Console
        «Проіндексовано, хоча заблоковано файлом robots.txt».

        Заборона тут не ховає сторінку з пошуку. Вона лише не дає її
        прочитати — а посилання на кабінет, кошик і пошук стоять у шапці, тож
        Google їх однаково знаходить і заносить в індекс саму адресу, без
        вмісту. Виходить замок: заборона читати заважає прочитати заборону
        індексувати.

        Ховає сторінку мета-тег `noindex`, і він у всіх трьох уже стоїть — див.
        generateMetadata у їхніх page.tsx. Щоб він спрацював, Google має
        сторінку відкрити. Тому пускаємо.

        Адмінка й API лишаються: на них немає жодного посилання з сайту, тож
        описаної пастки не буде, а віддавати їх роботам ні до чого.
      */
      disallow: ['/admin', '/api'],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}

export default robots
