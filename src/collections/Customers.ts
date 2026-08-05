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
    forgotPassword: {
      // Лист веде в кабінет на сайті, а не в адмінку Payload.
      generateEmailSubject: () => 'Вхід у кабінет МК',
      generateEmailHTML: (args) => {
        const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
        const link = `${base}/account/reset?token=${args?.token}`
        return [
          '<p>Вітаємо!</p>',
          '<p>Щоб зайти в кабінет і відкрити свої курси, перейдіть за посиланням:</p>',
          `<p><a href="${link}">${link}</a></p>`,
          '<p>Посилання діє годину. Якщо ви його не запитували — просто проігноруйте лист.</p>',
        ].join('')
      },
    },
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
