import type { Field, GlobalConfig } from 'payload'

import { anyone, isAdmin } from '@/access'

/*
  Тексти двох головних сторінок — «Магазин» і «Навчання».

  Досі вони жили в коді (lib/i18n.ts), і будь-яка правка заголовка означала
  деплой. Тепер їх редагують в адмінці, у «Контенті», поруч із «Про бренд».

  Глобали, а не сторінки в колекції «Сторінки»: у цих екранів жорсткі слоти —
  підпис, заголовок, кнопка, рівно три кроки в ряд. Rich text, яким живуть
  оферта й часті питання, такого не описує. Та сама причина, що й у About.

  Порожнє поле = текст із коду. Це не запасний варіант на всяк випадок, а
  спосіб не залишити сайт із дірками: клієнтка може стерти заголовок і піти
  пити каву, і сторінка від цього не розсиплеться.
*/

const heroFields: Field[] = [
  {
    name: 'hero',
    type: 'group',
    label: 'Перший екран',
    fields: [
      { name: 'label', type: 'text', label: 'Підпис над заголовком', localized: true },
      {
        name: 'title',
        type: 'textarea',
        label: 'Заголовок',
        localized: true,
        admin: { description: 'Перенесення рядка в цьому полі стає перенесенням на сайті.' },
      },
      { name: 'body', type: 'textarea', label: 'Опис під заголовком', localized: true },
      { name: 'cta', type: 'text', label: 'Напис на кнопці', localized: true },
    ],
  },
]

/** Заголовок секції — однаковий у «Категорій», «Напрямів», «Доставки». */
const sectionHeading = (name: string, label: string, description?: string): Field => ({
  name,
  type: 'group',
  label,
  admin: description ? { description } : undefined,
  fields: [
    { name: 'label', type: 'text', label: 'Підпис над заголовком', localized: true },
    { name: 'title', type: 'textarea', label: 'Заголовок', localized: true },
  ],
})

/**
 * Секція з трьома пронумерованими кроками: «Доставка й оплата» в магазині,
 * «Після оплати» в курсах. Розмітка однакова, різниться лише зміст.
 */
const stepsSection = (name: string, label: string, description: string): Field => ({
  name,
  type: 'group',
  label,
  admin: { description },
  fields: [
    { name: 'label', type: 'text', label: 'Підпис над заголовком', localized: true },
    { name: 'title', type: 'textarea', label: 'Заголовок', localized: true },
    {
      name: 'steps',
      type: 'array',
      label: 'Кроки',
      labels: { singular: 'Крок', plural: 'Кроки' },
      admin: {
        description: 'У макеті їх три в ряд. Більше — перенесуться на наступний рядок.',
        components: { RowLabel: '@/components/admin/StepRowLabel#StepRowLabel' },
      },
      fields: [
        {
          name: 'number',
          type: 'text',
          label: 'Номер',
          admin: { description: 'Як у макеті: 01, 02, 03.' },
        },
        { name: 'title', type: 'text', label: 'Заголовок кроку', localized: true },
        { name: 'body', type: 'textarea', label: 'Опис', localized: true },
      ],
    },
  ],
})

const landing = (
  slug: string,
  label: string,
  description: string,
  sections: Field[],
): GlobalConfig => ({
  slug,
  label,
  admin: { group: 'Контент', description },
  access: { read: anyone, update: isAdmin },
  fields: [...heroFields, ...sections],
})

/** Одна з двох гілок порталу: напис на кнопці й фото на весь екран. */
const branch = (name: string, label: string, description: string): Field => ({
  name,
  type: 'group',
  label,
  admin: { description },
  fields: [
    { name: 'label', type: 'text', label: 'Напис на кнопці', localized: true },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Фото',
      admin: { description: 'Вертикальне, від 1200 px по довшій стороні. Порожньо — фото з коду.' },
    },
    {
      name: 'alt',
      type: 'text',
      label: 'Опис фото',
      localized: true,
      admin: { description: 'Читають ті, хто користується екранним диктором, і Google.' },
    },
  ],
})

/*
  Головна — не сторінка з текстами, а розвилка: два фото на весь екран і дві
  кнопки. Заголовка немає взагалі, його роль грає лого посередині.

  Раніше ці поля лежали в «Налаштуваннях сайту», у вкладці «Головна», і
  жодне з них сторінка не читала: заголовок, підзаголовок і фон писалися в
  базу сідом і там і лишалися. Тепер поля справжні.
*/
export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Сторінка «Головна»',
  admin: {
    group: 'Контент',
    description:
      'Розвилка на вході: дві гілки бренду. Заголовка тут немає — посередині стоїть лого.',
  },
  access: { read: anyone, update: isAdmin },
  fields: [
    branch('learn', 'Гілка «Навчання»', 'Ліворуч на комп’ютері, зверху на телефоні. Веде на /courses.'),
    branch('shop', 'Гілка «Магазин»', 'Праворуч на комп’ютері, знизу на телефоні. Веде на /shop.'),
  ],
}

export const ShopPage = landing(
  'shop-page',
  'Сторінка «Магазин»',
  'Тексти на /shop. Картки товарів і категорій сюди не входять — вони беруться з «Товарів» і «Категорій».',
  [
    sectionHeading('categories', 'Категорії'),
    stepsSection(
      'delivery',
      'Доставка й оплата',
      'Блок із трьома кроками: як оформити, як пакуємо, як отримати.',
    ),
    sectionHeading('journal', 'Журнал'),
  ],
)

export const CoursesPage = landing(
  'courses-page',
  'Сторінка «Навчання»',
  'Тексти на /courses. Самі курси й напрями редагуються в розділі «Курси».',
  [
    sectionHeading('directions', 'Напрями'),
    stepsSection(
      'afterPayment',
      'Після оплати',
      'Блок із трьома кроками: як купити, як приходить доступ, як дивитись.',
    ),
  ],
)
