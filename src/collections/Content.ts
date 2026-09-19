import type { CollectionConfig } from 'payload'

import { isAdmin, publishedOrAdmin } from '@/access'
import { slugField } from '@/fields/slug'

const seoFields = [
  {
    type: 'collapsible' as const,
    label: 'SEO',
    admin: { initCollapsed: true },
    fields: [
      {
        name: 'metaTitle',
        type: 'text' as const,
        label: 'Заголовок для Google',
        localized: true,
        admin: { description: 'Порожньо — береться назва сторінки.' },
      },
      {
        name: 'metaDescription',
        type: 'textarea' as const,
        label: 'Опис для Google',
        localized: true,
        admin: { description: 'До 160 символів. Це те, що людина бачить у пошуку під заголовком.' },
      },
      { name: 'ogImage', type: 'upload' as const, relationTo: 'media' as const, label: 'Картинка для соцмереж' },
    ],
  },
]

/** Статичні сторінки: про бренд, доставка й оплата, оферта. Редагуються клієнткою. */
export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Сторінка', plural: 'Сторінки' },
  admin: {
    useAsTitle: 'title',
    group: 'Контент',
    defaultColumns: ['title', 'slug', 'status'],
    description: 'Тексти сторінок «Про бренд», «Доставка й оплата», «Оферта».',
  },
  access: { read: publishedOrAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'title', type: 'text', label: 'Назва', required: true, localized: true },
    slugField(),
    { name: 'intro', type: 'textarea', label: 'Вступний абзац', localized: true },
    { name: 'cover', type: 'upload', relationTo: 'media', label: 'Обкладинка' },
    { name: 'content', type: 'richText', label: 'Текст', localized: true },
    ...seoFields,
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      defaultValue: 'draft',
      index: true,
      options: [
        { label: 'Чернетка', value: 'draft' },
        { label: 'Опубліковано', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}

/** Журнал: гайди й поради. Найсильніший безкоштовний канал трафіку з Google. */
export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: { singular: 'Стаття', plural: 'Журнал' },
  admin: {
    useAsTitle: 'title',
    group: 'Контент',
    defaultColumns: ['title', 'publishedAt', 'status'],
  },
  access: { read: publishedOrAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'title', type: 'text', label: 'Заголовок', required: true, localized: true },
    slugField(),
    { name: 'excerpt', type: 'textarea', label: 'Короткий анонс', localized: true },
    { name: 'cover', type: 'upload', relationTo: 'media', label: 'Обкладинка' },
    { name: 'content', type: 'richText', label: 'Текст статті', localized: true },
    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      label: 'Теги',
      // Теги — не службові мітки, а видимий рядок фільтрів над списком статей
      // (155:3602) і значення в адресі: /journal?tag=вʼязання. Без локалізації
      // англійська версія показувала б українські слова й українські адреси.
      localized: true,
      admin: { description: 'Наприклад: вʼязання, догляд, подарунки.' },
    },
    {
      name: 'relatedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'Товари зі статті',
    },
    {
      name: 'relatedCourses',
      type: 'relationship',
      relationTo: 'courses',
      hasMany: true,
      label: 'Курси зі статті',
    },
    ...seoFields,
    {
      name: 'publishedAt',
      type: 'date',
      label: 'Дата публікації',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'status',
      type: 'select',
      label: 'Статус',
      defaultValue: 'draft',
      index: true,
      options: [
        { label: 'Чернетка', value: 'draft' },
        { label: 'Опубліковано', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}

/** Підписники на розсилку. Окремо від покупців: підписатись можна без покупки. */
export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Підписник', plural: 'Підписники' },
  admin: { useAsTitle: 'email', group: 'Продажі', defaultColumns: ['email', 'source', 'createdAt'] },
  access: { read: isAdmin, create: () => true, update: isAdmin, delete: isAdmin },
  fields: [
    { name: 'email', type: 'email', label: 'Пошта', required: true, unique: true, index: true },
    {
      name: 'source',
      type: 'select',
      label: 'Звідки',
      defaultValue: 'footer',
      options: [
        { label: 'Форма в підвалі', value: 'footer' },
        { label: 'Оформлення замовлення', value: 'checkout' },
        { label: 'Додано вручну', value: 'manual' },
      ],
    },
    { name: 'active', type: 'checkbox', label: 'Активний', defaultValue: true },
  ],
}
