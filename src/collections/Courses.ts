import type { CollectionConfig } from 'payload'

import { anyone, isAdmin, publishedOrAdmin } from '@/access'
import { slugField } from '@/fields/slug'

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
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Обкладинка' },
    { name: 'order', type: 'number', label: 'Порядок', defaultValue: 0, admin: { position: 'sidebar' } },
  ],
}

export const Courses: CollectionConfig = {
  slug: 'courses',
  labels: { singular: 'Курс', plural: 'Курси' },
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
            { name: 'description', type: 'richText', label: 'Опис', localized: true },
            {
              type: 'row',
              fields: [
                { name: 'price', type: 'number', label: 'Ціна, ₴', required: true, min: 0, admin: { width: '50%' } },
                { name: 'oldPrice', type: 'number', label: 'Стара ціна, ₴', min: 0, admin: { width: '50%' } },
              ],
            },
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
                { label: 'І те, і те', value: 'both' },
              ],
            },
            {
              name: 'telegramChatId',
              type: 'text',
              label: 'ID Telegram-каналу',
              admin: {
                condition: (data) => ['telegram', 'both'].includes(data?.accessType),
                description:
                  'Наприклад -1001234567890. Бот має бути адміністратором каналу з правом створювати запрошення.',
              },
            },
            {
              name: 'canvaUrl',
              type: 'text',
              label: 'Посилання на Canva (для курсу цілком)',
              admin: { condition: (data) => ['canva', 'both'].includes(data?.accessType) },
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
    { name: 'featured', type: 'checkbox', label: 'Показувати на головній', admin: { position: 'sidebar' } },
    slugField(),
  ],
}
