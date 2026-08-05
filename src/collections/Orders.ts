import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Замовлення', plural: 'Замовлення' },
  admin: {
    useAsTitle: 'orderNumber',
    group: 'Продажі',
    defaultColumns: ['orderNumber', 'customerName', 'total', 'paymentStatus', 'createdAt'],
  },
  access: {
    create: isAdmin,
    read: ({ req }) => {
      if (req.user?.collection === 'users') return true
      if (req.user?.collection === 'customers') return { customer: { equals: req.user.id } }
      return false
    },
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'orderNumber',
          type: 'text',
          label: 'Номер',
          required: true,
          unique: true,
          index: true,
          admin: { width: '50%', readOnly: true },
        },
        {
          name: 'paymentStatus',
          type: 'select',
          label: 'Оплата',
          defaultValue: 'pending',
          index: true,
          options: [
            { label: 'Очікує оплати', value: 'pending' },
            { label: 'Оплачено', value: 'paid' },
            { label: 'Часткова передплата', value: 'partial' },
            { label: 'Скасовано', value: 'cancelled' },
            { label: 'Повернено', value: 'refunded' },
          ],
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: 'Позиції',
      minRows: 1,
      admin: { initCollapsed: false },
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'kind',
              type: 'select',
              label: 'Тип',
              required: true,
              options: [
                { label: 'Товар', value: 'product' },
                { label: 'Курс', value: 'course' },
              ],
              admin: { width: '25%' },
            },
            { name: 'title', type: 'text', label: 'Назва', required: true, admin: { width: '45%' } },
            { name: 'quantity', type: 'number', label: 'К-сть', required: true, defaultValue: 1, admin: { width: '15%' } },
            { name: 'price', type: 'number', label: 'Ціна, ₴', required: true, admin: { width: '15%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'product', type: 'relationship', relationTo: 'products', label: 'Товар', admin: { width: '50%' } },
            { name: 'course', type: 'relationship', relationTo: 'courses', label: 'Курс', admin: { width: '50%' } },
          ],
        },
        { name: 'variantId', type: 'text', label: 'ID варіації', admin: { readOnly: true } },
        { name: 'variantLabel', type: 'text', label: 'Варіація' },
      ],
    },
    {
      label: 'Покупець',
      type: 'collapsible',
      fields: [
        { name: 'customer', type: 'relationship', relationTo: 'customers', label: 'Обліковий запис' },
        {
          type: 'row',
          fields: [
            { name: 'customerName', type: 'text', label: "Ім'я", required: true, admin: { width: '34%' } },
            { name: 'customerPhone', type: 'text', label: 'Телефон', required: true, admin: { width: '33%' } },
            { name: 'customerEmail', type: 'email', label: 'Пошта', required: true, admin: { width: '33%' } },
          ],
        },
      ],
    },
    {
      label: 'Доставка',
      type: 'collapsible',
      admin: { condition: (data) => data?.items?.some?.((i: { kind?: string }) => i?.kind === 'product') },
      fields: [
        {
          name: 'deliveryMethod',
          type: 'select',
          label: 'Спосіб',
          options: [
            { label: 'Нова Пошта — відділення', value: 'np_branch' },
            { label: 'Нова Пошта — поштомат', value: 'np_locker' },
            { label: "Нова Пошта — кур'єр", value: 'np_courier' },
            { label: 'Укрпошта', value: 'ukrposhta' },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'deliveryCity', type: 'text', label: 'Місто', admin: { width: '50%' } },
            { name: 'deliveryBranch', type: 'text', label: 'Відділення / адреса', admin: { width: '50%' } },
          ],
        },
        { name: 'comment', type: 'textarea', label: 'Коментар до замовлення' },
      ],
    },
    {
      label: 'Гроші',
      type: 'collapsible',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'subtotal', type: 'number', label: 'Сума позицій, ₴', required: true, admin: { width: '25%' } },
            { name: 'discount', type: 'number', label: 'Знижка, ₴', defaultValue: 0, admin: { width: '25%' } },
            { name: 'deliveryCost', type: 'number', label: 'Доставка, ₴', defaultValue: 0, admin: { width: '25%' } },
            { name: 'total', type: 'number', label: 'До сплати, ₴', required: true, admin: { width: '25%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'promoCode', type: 'relationship', relationTo: 'promo-codes', label: 'Промокод', admin: { width: '50%' } },
            {
              name: 'prepaidAmount',
              type: 'number',
              label: 'Передплата, ₴',
              defaultValue: 0,
              admin: { width: '50%', description: 'Для накладеного платежу — сплачена наперед частина.' },
            },
          ],
        },
        { name: 'paymentReference', type: 'text', label: 'Ідентифікатор платежу', admin: { readOnly: true } },
        {
          name: 'fiscalReceipt',
          type: 'text',
          label: 'Фіскальний чек',
          admin: { readOnly: true, description: 'ID чека в Checkbox. Порожньо — ПРРО ще не підключено.' },
        },
      ],
    },
    {
      name: 'fulfillmentStatus',
      type: 'select',
      label: 'Виконання',
      defaultValue: 'new',
      options: [
        { label: 'Нове', value: 'new' },
        { label: 'Комплектується', value: 'packing' },
        { label: 'Відправлено', value: 'shipped' },
        { label: 'Виконано', value: 'done' },
        { label: 'Скасовано', value: 'cancelled' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'trackingNumber', type: 'text', label: 'ТТН', admin: { position: 'sidebar' } },
    {
      name: 'accessGranted',
      type: 'checkbox',
      label: 'Доступ до курсів видано',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
