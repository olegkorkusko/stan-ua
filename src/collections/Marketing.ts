import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '@/access'

export const PromoCodes: CollectionConfig = {
  slug: 'promo-codes',
  labels: { singular: 'Промокод', plural: 'Промокоди' },
  admin: {
    useAsTitle: 'code',
    group: 'Продажі',
    defaultColumns: ['code', 'type', 'value', 'usedCount', 'active'],
  },
  access: { read: isAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    {
      name: 'code',
      type: 'text',
      label: 'Код',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value)] },
      admin: { description: 'Регістр не має значення — код завжди зберігається великими літерами.' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          label: 'Тип знижки',
          required: true,
          defaultValue: 'percent',
          options: [
            { label: 'Відсоток', value: 'percent' },
            { label: 'Фіксована сума, ₴', value: 'fixed' },
          ],
          admin: { width: '50%' },
        },
        { name: 'value', type: 'number', label: 'Розмір', required: true, min: 0, admin: { width: '50%' } },
      ],
    },
    {
      name: 'appliesTo',
      type: 'select',
      label: 'На що діє',
      defaultValue: 'all',
      options: [
        { label: 'На все', value: 'all' },
        { label: 'Лише курси', value: 'courses' },
        { label: 'Лише товари', value: 'products' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'validFrom', type: 'date', label: 'Діє з', admin: { width: '50%' } },
        { name: 'validUntil', type: 'date', label: 'Діє до', admin: { width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'usageLimit',
          type: 'number',
          label: 'Ліміт використань',
          admin: { width: '50%', description: 'Порожньо — без обмежень.' },
        },
        {
          name: 'minOrderTotal',
          type: 'number',
          label: 'Мінімальна сума замовлення, ₴',
          admin: { width: '50%' },
        },
      ],
    },
    { name: 'usedCount', type: 'number', label: 'Використано разів', defaultValue: 0, admin: { readOnly: true } },
    { name: 'active', type: 'checkbox', label: 'Активний', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  labels: { singular: 'Відгук', plural: 'Відгуки' },
  admin: {
    useAsTitle: 'authorName',
    group: 'Контент',
    defaultColumns: ['authorName', 'rating', 'status', 'createdAt'],
    description: 'Нові відгуки не показуються на сайті, доки ви їх не схвалите.',
  },
  access: {
    read: ({ req }) => (req.user?.collection === 'users' ? true : { status: { equals: 'approved' } }),
    create: anyone,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'authorName', type: 'text', label: "Ім'я", required: true },
    {
      name: 'rating',
      type: 'number',
      label: 'Оцінка',
      required: true,
      min: 1,
      max: 5,
      defaultValue: 5,
    },
    { name: 'text', type: 'textarea', label: 'Відгук', required: true },
    { name: 'photos', type: 'upload', relationTo: 'media', hasMany: true, label: 'Фото робіт' },
    {
      type: 'row',
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', label: 'Товар', admin: { width: '50%' } },
        { name: 'course', type: 'relationship', relationTo: 'courses', label: 'Курс', admin: { width: '50%' } },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'На модерації', value: 'pending' },
        { label: 'Схвалено', value: 'approved' },
        { label: 'Відхилено', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
