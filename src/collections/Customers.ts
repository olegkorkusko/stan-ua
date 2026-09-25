import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'
import {
  deliveryMethodOptions,
  storedPaymentMethodOptions,
  receiptChannelOptions,
} from '@/lib/delivery'

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
      name: 'savedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'Збережені товари',
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
    /*
      Профіль доставки — те, що кабінет показує на вкладці «Дані для доставки»
      (138:3085). Заповнюється сам після кожного замовлення (`fulfillOrder`),
      покупець може виправити його з кабінету.

      Свідомо ЛИШЕ ті поля, які намальовані: спосіб, місто, відділення, спосіб
      оплати й канал чека. Індексу Укрпошти тут немає — у макеті його не
      показують, а зберігати про запас те, чого ніде не видно, немає сенсу.
    */
    {
      label: 'Дані для доставки',
      type: 'collapsible',
      admin: { initCollapsed: true },
      fields: [
        { name: 'deliveryMethod', type: 'select', label: 'Спосіб', options: deliveryMethodOptions },
        {
          type: 'row',
          fields: [
            { name: 'deliveryCity', type: 'text', label: 'Місто', admin: { width: '50%' } },
            { name: 'deliveryBranch', type: 'text', label: 'Відділення / адреса', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'paymentMethod',
              type: 'select',
              label: 'Спосіб оплати',
              options: storedPaymentMethodOptions,
              admin: { width: '50%' },
            },
            {
              name: 'receiptChannel',
              type: 'select',
              label: 'Чек',
              defaultValue: 'email',
              options: receiptChannelOptions,
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'cardMask',
          type: 'text',
          label: 'Картка',
          admin: {
            readOnly: true,
            description:
              'Останні цифри картки, якою платили. Приходить від WayForPay — ми номера не бачимо й не зберігаємо.',
          },
        },
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
