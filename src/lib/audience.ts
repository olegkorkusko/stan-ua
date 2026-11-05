import type { Where } from 'payload'

import type { Region } from '@/lib/region'

/*
  Кому показувати товар або курс.

  Один і той самий виріб може мати дві картки: одну для України зі своєю
  ціною, другу для закордону — з іншою ціною і, зазвичай, з перекладеним
  описом. Без цієї мітки покупець із США бачив би поруч обидві, та ще й
  половину каталогу українською, якої для нього не готували.

  Мітка про ЛОКАЦІЮ, не про мову. Мова відповідає лише за валюту показу:
  українець, який перемкнув сайт на англійську, бачить ті самі українські
  картки, просто в доларах. Країну дає IP — див. `getRegion`.

  Типове значення 'all': усе, що вже є в базі, показується всім, і додавання
  мітки нічого не ховає само по собі.
*/
export const AUDIENCE = ['all', 'ua', 'intl'] as const
export type Audience = (typeof AUDIENCE)[number]

export const audienceOptions: { label: string; value: Audience }[] = [
  { label: 'Усім', value: 'all' },
  { label: 'Тільки покупцям з України', value: 'ua' },
  { label: 'Тільки покупцям з-за кордону', value: 'intl' },
]

export const AUDIENCE_HINT =
  'Для кого ця картка. «Усім» — звичайний товар. Якщо того самого виробу у вас дві картки — українська й закордонна з іншою ціною, — поставте кожній свою мітку, і покупець побачить лише свою.'

/** Чи показувати цю картку відвідувачу з такого регіону. */
export const isVisibleIn = (audience: string | null | undefined, region: Region): boolean =>
  !audience || audience === 'all' || audience === region

/*
  Умова вибірки для списків: опубліковане й призначене цьому регіону.

  Зібрано в одному місці навмисно. Умова `status: published` і так стояла в
  пʼятнадцяти файлах, і дописувати до кожного ще й мітку руками означало
  напевно десь її забути — а забута вона не ламає сторінку, просто показує
  американцю українську картку, і ніхто цього не помітить.

  `exists: false` поруч із 'all' — запас на рядки, створені повз адмінку
  (сідери, імпорт таблиці): у них мітки може не бути взагалі.
*/
export const visibleWhere = (region: Region, extra?: Where): Where => {
  const audience: Where = {
    or: [
      { audience: { equals: 'all' } },
      { audience: { equals: region } },
      { audience: { exists: false } },
    ],
  }

  return { and: [{ status: { equals: 'published' } }, audience, ...(extra ? [extra] : [])] }
}
