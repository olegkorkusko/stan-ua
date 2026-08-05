import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

/**
 * Кошик живе на сервері, а не лише в браузері: інакше набране на телефоні
 * не доїде до компʼютера. Анонімний кошик тримається на токені з cookie,
 * після входу привʼязується до облікового запису.
 *
 * Доступ через REST закритий — усе йде через /api/cart, який сам перевіряє
 * право на конкретний кошик.
 */
export const Carts: CollectionConfig = {
  slug: 'carts',
  labels: { singular: 'Кошик', plural: 'Кошики' },
  admin: {
    useAsTitle: 'token',
    group: 'Продажі',
    defaultColumns: ['token', 'customer', 'updatedAt'],
    description: 'Незавершені кошики. Звідси беруться листи про кинутий кошик.',
  },
  access: { read: isAdmin, create: () => false, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'token', type: 'text', label: 'Токен', index: true, unique: true, required: true },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      label: 'Покупець',
      index: true,
    },
    { name: 'email', type: 'email', label: 'Пошта', admin: { description: 'Для листа про кинутий кошик.' } },
    {
      name: 'items',
      type: 'array',
      label: 'Позиції',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'kind',
              type: 'select',
              required: true,
              options: [
                { label: 'Товар', value: 'product' },
                { label: 'Курс', value: 'course' },
              ],
              admin: { width: '25%' },
            },
            { name: 'itemId', type: 'text', required: true, label: 'ID', admin: { width: '25%' } },
            { name: 'variantId', type: 'text', label: 'Варіація', admin: { width: '25%' } },
            { name: 'quantity', type: 'number', required: true, defaultValue: 1, admin: { width: '25%' } },
          ],
        },
      ],
    },
    {
      name: 'reminderSentAt',
      type: 'date',
      label: 'Лист про кинутий кошик надіслано',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
