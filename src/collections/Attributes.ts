import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '@/access'
import { slugField } from '@/fields/slug'

const access = { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin }

/**
 * Кольори винесені в окрему колекцію, а не в текстове поле товару:
 * так фільтр «за кольором» лишається чистим, а зразок кольору можна показати
 * кружечком на картці товару.
 */
export const Colors: CollectionConfig = {
  slug: 'colors',
  labels: { singular: 'Колір', plural: 'Кольори' },
  admin: { useAsTitle: 'title', group: 'Магазин', defaultColumns: ['title', 'hex'] },
  access,
  fields: [
    { name: 'title', type: 'text', label: 'Назва', required: true, localized: true },
    slugField(),
    {
      name: 'hex',
      type: 'text',
      label: 'Код кольору',
      required: true,
      defaultValue: '#CBBFB2',
      admin: { description: 'Наприклад #C2410C. Показується кружечком у фільтрі й на картці товару.' },
      validate: (value: unknown) =>
        typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
          ? true
          : 'Вкажіть колір у форматі #RRGGBB',
    },
  ],
}

export const Sizes: CollectionConfig = {
  slug: 'sizes',
  labels: { singular: 'Розмір', plural: 'Розміри' },
  admin: { useAsTitle: 'title', group: 'Магазин' },
  access,
  fields: [
    // Локалізований, як назви категорій і кольорів. Сьогодні тут коди S/M/L,
    // які перекладати нема потреби, але поле вільне: щойно зʼявиться
    // «Універсальний», англійська версія має показати «One size», а не його.
    { name: 'title', type: 'text', label: 'Розмір', required: true, localized: true },
    slugField(),
    {
      name: 'order',
      type: 'number',
      label: 'Порядок',
      defaultValue: 0,
      admin: { description: 'Менше число — вище у списку.' },
    },
  ],
}

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'Категорія', plural: 'Категорії' },
  admin: { useAsTitle: 'title', group: 'Магазин', defaultColumns: ['title', 'parent'] },
  access,
  fields: [
    { name: 'title', type: 'text', label: 'Назва', required: true, localized: true },
    slugField(),
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Батьківська категорія',
      admin: { position: 'sidebar' },
    },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Обкладинка' },
    {
      name: 'description',
      type: 'textarea',
      label: 'Короткий опис',
      localized: true,
    },
  ],
}
