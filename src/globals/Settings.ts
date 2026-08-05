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
          label: 'Головна',
          fields: [
            {
              name: 'announcement',
              type: 'text',
              label: 'Рядок-оголошення вгорі сайту',
              localized: true,
              admin: { description: 'Наприклад: «Безкоштовна доставка від 1500 ₴». Порожньо — рядок не показується.' },
            },
            { name: 'heroTitle', type: 'text', label: 'Заголовок на головній', localized: true },
            { name: 'heroSubtitle', type: 'textarea', label: 'Підзаголовок', localized: true },
            {
              name: 'heroMedia',
              type: 'upload',
              relationTo: 'media',
              label: 'Фон головної',
              admin: { description: 'Фото або коротке відео. Саме воно повільно рухається на фоні.' },
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
              name: 'prepaymentAmount',
              type: 'number',
              label: 'Передплата за накладений платіж, ₴',
              defaultValue: 200,
            },
            { name: 'deliveryInfo', type: 'richText', label: 'Текст про доставку', localized: true },
          ],
        },
      ],
    },
  ],
}
