import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { isAdmin, publishedOrAdmin } from '@/access'
import { slugField } from '@/fields/slug'

type Variant = { price?: number | null; stock?: number | null }

/**
 * Ціна «від» і ознака наявності зберігаються полями, а не рахуються на льоту:
 * інакше фільтр за ціною та за наявністю довелось би робити в памʼяті,
 * а це ламається щойно товарів стане більше кількох сотень.
 */
const denormalise: CollectionBeforeChangeHook = ({ data }) => {
  const variants: Variant[] = Array.isArray(data.variants) ? data.variants : []

  if (variants.length > 0) {
    const prices = variants
      .map((v) => (typeof v.price === 'number' && v.price > 0 ? v.price : data.price))
      .filter((p): p is number => typeof p === 'number')
    data.priceFrom = prices.length ? Math.min(...prices) : data.price
    data.inStock = variants.some((v) => (v.stock ?? 0) > 0)
    data.totalStock = variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)
  } else {
    data.priceFrom = data.price
    data.inStock = (data.stock ?? 0) > 0
    data.totalStock = data.stock ?? 0
  }

  return data
}

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'Товар', plural: 'Товари' },
  admin: {
    useAsTitle: 'title',
    group: 'Магазин',
    defaultColumns: ['title', 'price', 'totalStock', 'status'],
    description: 'Готові прикраси, набори для створення та матеріали.',
  },
  access: { read: publishedOrAdmin, create: isAdmin, update: isAdmin, delete: isAdmin },
  hooks: { beforeChange: [denormalise] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Основне',
          fields: [
            { name: 'title', type: 'text', label: 'Назва', required: true, localized: true },
            {
              name: 'shortDescription',
              type: 'textarea',
              label: 'Короткий опис',
              localized: true,
              admin: { description: 'Один-два рядки під назвою на сторінці товару.' },
            },
            {
              name: 'description',
              type: 'richText',
              label: 'Повний опис',
              localized: true,
            },
            {
              name: 'images',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              label: 'Фотографії',
              admin: { description: 'Перше фото — головне. Друге показується при наведенні на картку.' },
            },
            {
              name: 'price',
              type: 'number',
              label: 'Ціна, ₴',
              required: true,
              min: 0,
              admin: { description: 'Базова ціна. Для окремих варіацій її можна перевизначити нижче.' },
            },
            {
              name: 'oldPrice',
              type: 'number',
              label: 'Стара ціна, ₴',
              min: 0,
              admin: { description: 'Заповніть, якщо хочете показати перекреслену ціну.' },
            },
          ],
        },
        {
          label: 'Варіації та залишки',
          description:
            'Якщо товар буває в різних кольорах чи розмірах — додайте варіації. Залишок ведеться по кожній окремо.',
          fields: [
            {
              name: 'variants',
              type: 'array',
              label: 'Варіації',
              labels: { singular: 'варіація', plural: 'варіації' },
              admin: {
                initCollapsed: true,
                components: {
                  RowLabel: '@/components/admin/VariantRowLabel#VariantRowLabel',
                },
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'color',
                      type: 'relationship',
                      relationTo: 'colors',
                      label: 'Колір',
                      admin: { width: '50%' },
                    },
                    {
                      name: 'size',
                      type: 'relationship',
                      relationTo: 'sizes',
                      label: 'Розмір',
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'sku', type: 'text', label: 'Артикул', admin: { width: '34%' } },
                    {
                      name: 'price',
                      type: 'number',
                      label: 'Ціна, ₴',
                      min: 0,
                      admin: { width: '33%', description: 'Порожньо — береться базова.' },
                    },
                    {
                      name: 'stock',
                      type: 'number',
                      label: 'Залишок, шт',
                      defaultValue: 0,
                      min: 0,
                      required: true,
                      admin: { width: '33%' },
                    },
                  ],
                },
                { name: 'image', type: 'upload', relationTo: 'media', label: 'Фото варіації' },
              ],
            },
            {
              name: 'stock',
              type: 'number',
              label: 'Залишок, шт',
              defaultValue: 0,
              min: 0,
              admin: {
                description: 'Використовується, якщо варіацій немає.',
                condition: (data) => !data?.variants || data.variants.length === 0,
              },
            },
          ],
        },
        {
          label: 'Набір',
          fields: [
            {
              name: 'isKit',
              type: 'checkbox',
              label: 'Це набір із кількох товарів',
              defaultValue: false,
            },
            {
              name: 'kitItems',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              label: 'Що входить у набір',
              admin: { condition: (data) => Boolean(data?.isKit) },
            },
            {
              name: 'addons',
              type: 'relationship',
              relationTo: 'products',
              hasMany: true,
              label: 'Можна докупити до набору',
              admin: {
                condition: (data) => Boolean(data?.isKit),
                description: 'Дрібниці, які покупець зможе додати до набору прямо на сторінці.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Категорія',
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
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Показувати на головній',
      admin: { position: 'sidebar' },
    },
    slugField(),
    // Службові поля: заповнюються автоматично, потрібні для фільтрів.
    {
      name: 'priceFrom',
      type: 'number',
      index: true,
      admin: { hidden: true },
    },
    { name: 'inStock', type: 'checkbox', index: true, admin: { hidden: true } },
    { name: 'totalStock', type: 'number', admin: { readOnly: true, position: 'sidebar' }, label: 'Усього на складі' },
  ],
}
