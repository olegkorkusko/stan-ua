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
                  'Порожньо — смуга складається сама з порога безкоштовної доставки й перекладається. Впишіть свій текст, щоб показати інше оголошення — тоді його треба перекласти окремо для кожної мови.',
              },
            },
          ],
        },
        {
          label: 'Контакти',
          fields: [
            { name: 'phone', type: 'text', label: 'Телефон' },
            {
              name: 'email',
              type: 'email',
              label: 'Пошта для покупців',
              admin: { description: 'Публічна — показується в підвалі сайту.' },
            },
            {
              name: 'telegramNotify',
              type: 'text',
              label: 'Telegram для сповіщень про замовлення',
              admin: {
                description:
                  'Напишіть боту @stanua_access_bot «Почати» — він одразу надішле ваш номер. Вставте його сюди. Кілька людей — через кому.',
              },
            },
            {
              name: 'orderNotifyEmail',
              type: 'email',
              label: 'Пошта для сповіщень про замовлення',
              admin: {
                description:
                  'Куди писати про нові замовлення. Порожньо — сповіщення йдуть лише в Telegram. Тут доречна робоча адреса, яку читають щодня.',
              },
            },
            {
              name: 'notifyPendingOrders',
              type: 'checkbox',
              label: 'Сповіщати і про неоплачені замовлення',
              admin: {
                description:
                  'Типово сповіщення приходить лише про оплачені. З галочкою — і про ті, де людина дійшла до оплати й не заплатила: інколи це просто не пройшла картка, і дзвінок повертає покупця. Але таких замовлень завжди більше, ніж оплачених.',
              },
            },
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
              admin: {
                description:
                  'Це саме число працює у двох місцях: смуга прогресу в кошику й оголошення вгорі сайту. Порожньо — доставка завжди платна, а смуги вгорі немає.',
              },
            },
            {
              name: 'productionTime',
              type: 'text',
              label: 'Строк виготовлення',
              localized: true,
              admin: {
                description:
                  'Типовий строк: стоїть у характеристиках тих товарів, де не вказано власний. Власний задається в самому товарі, вкладка «Основне».',
              },
            },
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
