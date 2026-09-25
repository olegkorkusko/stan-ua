import type { CollectionAfterChangeHook, CollectionConfig } from 'payload'

import { isAdmin } from '@/access'
import { deliveryMethodOptions, storedPaymentMethodOptions } from '@/lib/delivery'

/*
  Лист із номером накладної.

  Клієнтка вписує ТТН в адмінці, коли віддала посилку в перевізника. Досі це
  число просто лежало в базі: покупець його не бачив ніде й мусив питати в
  дірект. Тепер воно саме їде йому на пошту.

  Надсилаємо рівно раз — коли номер щойно з'явився або змінився. Інакше
  кожне збереження замовлення (змінили статус, дописали коментар) слало б
  покупцеві той самий лист заново.
*/
const notifyTracking: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  if (operation !== 'update') return doc

  const number = typeof doc.trackingNumber === 'string' ? doc.trackingNumber.trim() : ''
  if (!number || number === previousDoc?.trackingNumber?.trim?.()) return doc
  if (!doc.customerEmail) return doc

  const carrier = doc.deliveryMethod === 'ukrposhta' ? 'Укрпошта' : 'Нова Пошта'

  await req.payload
    .sendEmail({
      to: doc.customerEmail,
      subject: `Замовлення ${doc.orderNumber} відправлено`,
      text: [
        `Вітаємо! Замовлення ${doc.orderNumber} уже в дорозі.`,
        '',
        `${carrier}, накладна: ${number}`,
        '',
        'За цим номером можна відстежити посилку на сайті перевізника.',
      ].join('\n'),
    })
    .catch((error: unknown) => req.payload.logger.error({ err: error }, 'Лист про ТТН не пішов'))

  return doc
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  hooks: { afterChange: [notifyTracking] },
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
        { name: 'deliveryMethod', type: 'select', label: 'Спосіб', options: deliveryMethodOptions },
        {
          type: 'row',
          fields: [
            { name: 'deliveryCity', type: 'text', label: 'Місто', admin: { width: '40%' } },
            { name: 'deliveryBranch', type: 'text', label: 'Відділення / адреса', admin: { width: '40%' } },
            {
              name: 'deliveryPostcode',
              type: 'text',
              label: 'Індекс',
              admin: { width: '20%', description: 'Тільки для Укрпошти.' },
            },
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
        { name: 'promoCode', type: 'relationship', relationTo: 'promo-codes', label: 'Промокод' },
        {
          name: 'paymentMethod',
          type: 'select',
          label: 'Спосіб оплати',
          options: storedPaymentMethodOptions,
        },
        { name: 'paymentReference', type: 'text', label: 'Ідентифікатор платежу', admin: { readOnly: true } },
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
      name: 'newsletter',
      type: 'checkbox',
      label: 'Погодився на розсилку',
      admin: { readOnly: true, description: 'Галочка з форми оформлення.' },
    },
    {
      name: 'accessGranted',
      type: 'checkbox',
      label: 'Доступ до курсів видано',
      admin: { position: 'sidebar', readOnly: true },
    },
    // Кукі Meta, зняті в момент оформлення: за ними серверна подія покупки
    // зіставляється з людиною, яка бачила рекламу. В адмінці не потрібні.
    { name: 'metaFbp', type: 'text', admin: { hidden: true } },
    { name: 'metaFbc', type: 'text', admin: { hidden: true } },
  ],
}
