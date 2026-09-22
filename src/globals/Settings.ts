import type { GlobalConfig } from 'payload'

import { anyone, isAdmin } from '@/access'

export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Налаштування сайту',
  admin: { group: 'Налаштування' },
  access: { read: anyone, update: isAdmin },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Загальне',
          description: 'Те, що видно на всіх сторінках одразу.',
          fields: [
            {
              name: 'announcement',
              type: 'text',
              label: 'Рядок-оголошення вгорі сайту',
              localized: true,
              admin: {
                description:
                  'Наприклад: «Безкоштовна доставка від 1500 ₴». Порожньо — рядок не показується. На головній його немає: там сторінка без шапки.',
              },
            },
          ],
        },
        {
          label: 'Контакти',
          fields: [
            { name: 'phone', type: 'text', label: 'Телефон' },
            { name: 'email', type: 'email', label: 'Пошта' },
            { name: 'instagram', type: 'text', label: 'Instagram' },
            { name: 'telegram', type: 'text', label: 'Telegram' },
          ],
        },
        {
          label: 'Доставка й оплата',
          fields: [
            {
              name: 'freeDeliveryFrom',
              type: 'number',
              label: 'Безкоштовна доставка від, ₴',
              admin: { description: 'Порожньо — доставка завжди платна за тарифами перевізника.' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'prepaymentType',
                  type: 'select',
                  label: 'Передплата за накладений платіж',
                  defaultValue: 'fixed',
                  options: [
                    { label: 'Фіксована сума', value: 'fixed' },
                    { label: 'Відсоток від замовлення', value: 'percent' },
                  ],
                  admin: { width: '50%' },
                },
                {
                  name: 'prepaymentAmount',
                  type: 'number',
                  label: 'Скільки саме',
                  defaultValue: 200,
                  min: 0,
                  admin: {
                    width: '50%',
                    description: 'Для фіксованої — гривні (напр. 200). Для відсотка — число від 1 до 100.',
                  },
                },
              ],
            },
            { name: 'deliveryInfo', type: 'richText', label: 'Текст про доставку', localized: true },
          ],
        },
        {
          label: 'SEO та аналітика',
          description:
            'Як сайт виглядає в пошуку й соцмережах, і чим рахуються продажі. Окремі заголовки для конкретних сторінок задаються в самій сторінці, у блоці «SEO».',
          fields: [
            {
              name: 'seoTitle',
              type: 'text',
              label: 'Заголовок сайту для Google',
              localized: true,
              admin: {
                description:
                  'Те, що видно в пошуку й на вкладці браузера. Порожньо — береться назва з коду.',
              },
            },
            {
              name: 'seoDescription',
              type: 'textarea',
              label: 'Опис сайту для Google',
              localized: true,
              admin: { description: 'До 160 символів — далі пошук обрізає.' },
            },
            {
              name: 'seoImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Картинка для соцмереж',
              admin: {
                description:
                  'Показується, коли посилання на сайт кидають у Instagram, Telegram чи Facebook. Найкраще 1200×630.',
              },
            },
            {
              name: 'searchVisible',
              type: 'checkbox',
              label: 'Дозволити пошуковикам індексувати сайт',
              defaultValue: true,
              admin: {
                description:
                  'Зніміть галочку, поки сайт наповнюється: Google його не покаже. Не забудьте повернути на запуску.',
              },
            },
            {
              name: 'googleVerification',
              type: 'text',
              label: 'Код підтвердження Google Search Console',
              admin: {
                description:
                  'search.google.com/search-console → Додати ресурс → HTML-тег. Потрібен лише вміст content="…".',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'gaId',
                  type: 'text',
                  label: 'Google Analytics',
                  admin: {
                    width: '50%',
                    description: 'Ідентифікатор виду G-XXXXXXX.',
                  },
                },
                {
                  name: 'metaPixelId',
                  type: 'text',
                  label: 'Meta Pixel',
                  admin: {
                    width: '50%',
                    description: 'Число з 15–16 цифр із Events Manager.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
