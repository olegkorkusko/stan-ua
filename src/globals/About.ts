import type { GlobalConfig } from 'payload'

import { anyone, isAdmin } from '@/access'

/*
  «Про бренд» — окремий глобал, а не сторінка в колекції «Сторінки».

  Причина в макеті (94:2011): у нього жорсткі слоти — підпис, заголовок, два
  абзаци РІЗНОГО кольору, фото на всю ширину й рівно три цінності в ряд.
  Rich text, яким живуть доставка, оферта й часті питання, нічого з цього не
  описує: у ньому немає способу сказати «другий абзац приглушений» чи
  «ці три блоки стоять поряд».

  Глобал, а не ще одна колекція: сторінка про бренд на сайті одна.
*/
export const About: GlobalConfig = {
  slug: 'about',
  label: 'Про бренд',
  admin: { group: 'Контент' },
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      name: 'label',
      type: 'text',
      label: 'Підпис над заголовком',
      localized: true,
      admin: { description: 'Показується капслоком. У макеті — «ПРО БРЕНД».' },
    },
    { name: 'title', type: 'text', label: 'Заголовок', localized: true, required: true },
    {
      name: 'lead',
      type: 'textarea',
      label: 'Перший абзац',
      localized: true,
      admin: { description: 'Основний текст, темний.' },
    },
    {
      name: 'body',
      type: 'textarea',
      label: 'Другий абзац',
      localized: true,
      admin: { description: 'Продовження, приглушеним кольором.' },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      label: 'Фото на всю ширину',
    },
    {
      name: 'values',
      type: 'array',
      label: 'Цінності',
      maxRows: 3,
      admin: {
        description: 'Рівно три: у макеті вони стоять в один ряд по третині ширини.',
      },
      fields: [
        { name: 'title', type: 'text', label: 'Назва', localized: true, required: true },
        { name: 'description', type: 'textarea', label: 'Опис', localized: true },
      ],
    },
  ],
}
