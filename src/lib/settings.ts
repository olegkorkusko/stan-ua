import { cache } from 'react'

import type { Locale } from '@/lib/i18n'
import { payloadClient } from '@/lib/payload'
import type { Setting } from '@/payload-types'

/*
  Налаштування сайту потрібні layout'у двічі за один запит: у generateMetadata
  (заголовок, опис, картинка для соцмереж) і в самому layout (шапка, підвал,
  лічильники). cache() із React зводить це до одного звернення до бази —
  на час одного запиту, тож зміна в адмінці видно одразу, без перезбирання.

  depth: 1 — щоб разом із записом прийшла й картинка для соцмереж, а не саме
  лише її число.

  Помилку ковтаємо: сайт має відкриватись і тоді, коли база відповіла не
  одразу. Гірше, що станеться — типові заголовки з коду.
*/
export const siteSettings = cache(async (locale: Locale): Promise<Partial<Setting> | null> => {
  const payload = await payloadClient()
  return payload.findGlobal({ slug: 'settings', locale, depth: 1 }).catch((error: unknown) => {
    // Ковтати мовчки не можна: сайт працюватиме далі, але на типових текстах,
    // і зрозуміти, чому правка в адмінці «не застосувалась», буде ніяк.
    console.error('Не вдалось прочитати налаштування сайту', error)
    return null
  })
})
