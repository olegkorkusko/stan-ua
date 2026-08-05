import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

const isSelfOrAdmin = ({ req }: { req: { user?: { collection?: string; id?: string | number } | null } }) => {
  if (req.user?.collection === 'users') return true
  if (req.user?.collection === 'customers') return { id: { equals: req.user.id } }
  return false
}

/** Покупці. Окрема колекція авторизації — щоб не змішувати їх з адміністраторами. */
export const Customers: CollectionConfig = {
  slug: 'customers',
  labels: { singular: 'Покупець', plural: 'Покупці' },
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30,
    verify: false,
  },
  admin: {
    useAsTitle: 'email',
    group: 'Продажі',
    defaultColumns: ['email', 'name', 'phone', 'createdAt'],
  },
  access: {
    create: () => true,
    read: isSelfOrAdmin,
    update: isSelfOrAdmin,
    delete: isAdmin,
    admin: () => false,
  },
  fields: [
    { name: 'name', type: 'text', label: "Ім'я" },
    { name: 'phone', type: 'text', label: 'Телефон' },
    {
      name: 'savedCourses',
      type: 'relationship',
      relationTo: 'courses',
      hasMany: true,
      label: 'Збережені курси',
    },
    {
      name: 'access',
      type: 'array',
      label: 'Куплені доступи',
      admin: { readOnly: true, description: 'Заповнюється автоматично після оплати. Доступ безтерміновий.' },
      fields: [
        { name: 'course', type: 'relationship', relationTo: 'courses', label: 'Курс' },
        // Не називаємо поле "order": у таблицях масивів Payload уже є службова
        // колонка порядку, і назви індексів конфліктують.
        { name: 'relatedOrder', type: 'relationship', relationTo: 'orders', label: 'Замовлення' },
        { name: 'grantedAt', type: 'date', label: 'Видано' },
        { name: 'telegramInviteLink', type: 'text', label: 'Запрошення в Telegram' },
      ],
    },
    {
      name: 'subscribedToNewsletter',
      type: 'checkbox',
      label: 'Підписаний на розсилку',
      defaultValue: false,
    },
  ],
}
