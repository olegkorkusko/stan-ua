import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'
import { ValidationError } from 'payload'

import { anyone, isAdmin, publishedOrAdmin } from '@/access'
import { audienceField } from '@/fields/audience'
import { priceFields } from '@/fields/prices'
import { slugField } from '@/fields/slug'
import { withCanva, withTelegram, withWhatsapp } from '@/lib/course-access'
import { courseChannelProblem } from '@/lib/telegram'
import { SUGGEST_IN_CART } from './hints'

/** Напрями: вʼязання, бісероплетіння, макраме. Додаються з адмінки, не в коді. */
export const CourseDirections: CollectionConfig = {
  slug: 'course-directions',
  labels: { singular: 'Напрям', plural: 'Напрями курсів' },
  admin: { useAsTitle: 'title', group: 'Курси', defaultColumns: ['title', 'order'] },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'title', type: 'text', label: 'Назва', required: true, localized: true },
    slugField(),
    { name: 'tagline', type: 'text', label: 'Підпис під назвою', localized: true },
    { name: 'description', type: 'textarea', label: 'Опис напряму', localized: true },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Обкладинка картки' },
    /*
      Те саме, що в товару: картка в каталозі й шапка сторінки — різні місця,
      і медіа в них може бути різним. Обкладинка обовʼязкова за змістом,
      решта — за бажанням.
    */
    {
      name: 'cardHover',
      type: 'upload',
      relationTo: 'media',
      label: 'Фото при наведенні',
      admin: { description: 'Підміняє обкладинку, коли на картку наводять.' },
    },
    {
      name: 'cardVideo',
      type: 'upload',
      relationTo: 'media',
      label: 'Відео при наведенні',
      admin: {
        description:
          'Якщо є — грає замість фото при наведенні: без звуку, по колу. До 15 МБ.',
      },
    },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Фото в шапці сторінки',
      admin: { description: 'Порожньо — у шапці стане обкладинка.' },
    },
    {
      name: 'heroVideo',
      type: 'upload',
      relationTo: 'media',
      label: 'Відео в шапці сторінки',
      admin: { description: 'Грає саме, по колу й без звуку. Фото лишається першим кадром.' },
    },
    { name: 'order', type: 'number', label: 'Порядок', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}

const fail = (message: string, path = 'telegramChatId') =>
  new ValidationError({ collection: 'courses', errors: [{ message, path }] })

/*
  Не дати опублікувати курс, доступ до якого нікому буде видати.

  Помилка в id каналу або незданий ботові доступ інакше виявляються аж після
  першого продажу: гроші списано, лист пішов без посилання, покупець пише «а де
  курс?». Тому перевіряємо тут, поки курс ще в руках власниці.

  Перевіряємо не на кожне збереження, а коли є що перевіряти: змінився канал або
  курс саме зараз публікують. Інакше кожне редагування опису ходило б у Telegram.
*/
const verifyChannel: CollectionBeforeChangeHook = async ({ data, originalDoc }) => {
  // Чернетку лишаємо яку завгодно: курс заводять поступово.
  const publishing = data.status === 'published' && originalDoc?.status !== 'published'

  const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')
  const chatId = text(data.telegramChatId)
  const canva = text(data.canvaUrl)
  const whatsapp = text(data.whatsappUrl)

  /*
    Публікувати курс, доступ до якого нікому буде видати, не даємо: гроші
    списано, лист пішов без посилання, покупець пише «а де курс?».

    Для «Всі» вимагаємо не всі три, а хоча б одне. Способи складаються, і
    «Canva + група у WhatsApp, без Telegram» — така сама жива комбінація, як
    будь-яка інша; вимога каналу просто не дала б її опублікувати.
  */
  if (publishing) {
    if (data.accessType === 'telegram' && !chatId) {
      throw fail('Вкажіть ID каналу — інакше після оплати покупець не отримає доступу')
    }
    if (data.accessType === 'canva' && !canva) {
      throw fail('Вкажіть посилання на Canva — інакше після оплати покупець не отримає доступу', 'canvaUrl')
    }
    if (data.accessType === 'whatsapp' && !whatsapp) {
      throw fail('Вкажіть посилання на групу — інакше після оплати покупець не отримає доступу', 'whatsappUrl')
    }
    if (data.accessType === 'both' && !chatId && !canva && !whatsapp) {
      throw fail('Заповніть хоча б одне: канал у Telegram, Canva або групу у WhatsApp')
    }
  }

  /*
    Сам канал перевіряємо в Telegram — помилка в id або незданий ботові доступ
    інакше виявляються аж після першого продажу. Не на кожне збереження, а коли
    є що перевіряти: канал змінився або курс саме зараз публікують. Інакше
    кожне редагування опису ходило б у Telegram.
  */
  if (!withTelegram.includes(data.accessType) || !chatId) return data
  if (!publishing && chatId === originalDoc?.telegramChatId) return data

  const problem = await courseChannelProblem(chatId)
  if (problem) throw fail(problem)

  return data
}

export const Courses: CollectionConfig = {
  slug: 'courses',
  labels: { singular: 'Курс', plural: 'Курси' },
  hooks: { beforeChange: [verifyChannel] },
  admin: {
    useAsTitle: 'title',
    group: 'Курси',
    defaultColumns: ['title', 'direction', 'price', 'status'],
    description: 'Курс — це набір майстер-класів. Окремий МК теж заводиться тут, просто з одним уроком.',
  },
  access: { read: publishedOrAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Основне',
          fields: [
            { name: 'title', type: 'text', label: 'Назва курсу', required: true, localized: true },
            { name: 'tagline', type: 'text', label: 'Підпис під назвою', localized: true },
            { name: 'cover', type: 'upload', relationTo: 'media', label: 'Обкладинка' },
            { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true, label: 'Галерея робіт' },
            /*
              Те саме, що в товарі: ролик для картки в каталозі. Окремо від
              галереї, бо галерея — це слайдер на сторінці курсу, і ролик став
              би в ньому кадром, який не гортається.

              Порожньо — картка поводиться як раніше: обкладинка, а при
              наведенні перше фото з галереї, якщо воно є.
            */
            {
              name: 'cardVideo',
              type: 'upload',
              relationTo: 'media',
              label: 'Відео для картки',
              admin: {
                description:
                  'Програється при наведенні на картку в каталозі: без звуку, по колу. До 15 МБ — це 10–20 секунд. Обкладинка лишається тим, що видно до наведення.',
              },
            },
            { name: 'description', type: 'richText', label: 'Опис', localized: true },
            ...priceFields({ baseHint: 'Скільки коштує курс покупцям з України.' }),
            {
              name: 'level',
              type: 'select',
              label: 'Рівень',
              options: [
                { label: 'Для початківців', value: 'beginner' },
                { label: 'Середній', value: 'medium' },
                { label: 'Просунутий', value: 'advanced' },
              ],
            },
          ],
        },
        {
          label: 'Програма',
          description: 'Зазвичай 10–15 майстер-класів.',
          fields: [
            {
              name: 'lessons',
              type: 'array',
              label: 'Майстер-класи',
              labels: { singular: 'МК', plural: 'МК' },
              admin: {
                initCollapsed: true,
                components: { RowLabel: '@/components/admin/LessonRowLabel#LessonRowLabel' },
              },
              fields: [
                { name: 'title', type: 'text', label: 'Назва МК', required: true, localized: true },
                { name: 'description', type: 'textarea', label: 'Що всередині', localized: true },
                {
                  name: 'canvaUrl',
                  type: 'text',
                  label: 'Посилання на проєкт у Canva',
                  admin: {
                    description: 'Показується покупцю тільки після оплати. Публічно не видно.',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Доступ після оплати',
          description: 'Що саме отримує покупець одразу після оплати.',
          fields: [
            {
              name: 'accessType',
              type: 'select',
              label: 'Спосіб видачі',
              required: true,
              defaultValue: 'telegram',
              options: [
                { label: 'Запрошення в закритий Telegram-канал', value: 'telegram' },
                { label: 'Посилання на проєкт у Canva', value: 'canva' },
                { label: 'Група у WhatsApp', value: 'whatsapp' },
                { label: 'Всі', value: 'both' },
              ],
              admin: {
                description:
                  '«Всі» показує всі три поля — заповніть ті, що маєте. Так курс дістається і тим, хто в Telegram, і тим, хто у WhatsApp.',
              },
            },
            {
              name: 'telegramChatId',
              type: 'text',
              label: 'ID Telegram-каналу',
              admin: {
                condition: (data) => withTelegram.includes(data?.accessType),
                description:
                  'Наприклад -1001234567890. Бот має бути адміністратором каналу з правом створювати запрошення.',
              },
            },
            {
              name: 'canvaUrl',
              type: 'text',
              label: 'Посилання на Canva (для курсу цілком)',
              admin: { condition: (data) => withCanva.includes(data?.accessType) },
            },
            /*
              Персонального запрошення, як у Telegram, WhatsApp не вміє: API для
              цього немає, посилання на групу створюють руками в застосунку, і
              воно одне на всіх. Тому його можна переслати тому, хто не платив, —
              і саме це сказано в підписі, щоб клієнтка вирішувала свідомо.
            */
            {
              name: 'whatsappUrl',
              type: 'text',
              label: 'Посилання на групу WhatsApp',
              admin: {
                condition: (data) => withWhatsapp.includes(data?.accessType),
                description:
                  'Увага: у WhatsApp посилання на групу одне для всіх і безстрокове, його можна переслати. Персональних запрошень, як у Telegram, WhatsApp не робить.',
              },
            },
          ],
        },
        {
          label: 'Часті питання',
          fields: [
            {
              name: 'faq',
              type: 'array',
              label: 'Питання й відповіді',
              admin: { initCollapsed: true },
              fields: [
                { name: 'question', type: 'text', label: 'Питання', required: true, localized: true },
                { name: 'answer', type: 'textarea', label: 'Відповідь', required: true, localized: true },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'direction',
      type: 'relationship',
      relationTo: 'course-directions',
      label: 'Напрям',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      defaultValue: 'draft',
      options: [
        { label: 'Чернетка', value: 'draft' },
        { label: 'Опубліковано', value: 'published' },
      ],
      admin: { position: 'sidebar' },
      index: true,
    },
    audienceField(),
    { name: 'featured', type: 'checkbox', label: 'Показувати на головній', admin: { position: 'sidebar' } },
    {
      name: 'suggestInCart',
      type: 'checkbox',
      label: 'Пропонувати в кошику',
      admin: {
        position: 'sidebar',
        description: SUGGEST_IN_CART,
      },
    },
    slugField(),
  ],
}
