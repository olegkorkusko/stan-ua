import type { CollectionBeforeChangeHook, CollectionConfig } from 'payload'

import { isAdmin, publishedOrAdmin } from '@/access'
import { slugField } from '@/fields/slug'

type Variant = { price?: number | null; stock?: number | null; color?: unknown; size?: unknown }

const asId = (value: unknown): number | null => {
  if (typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) return Number((value as { id: number }).id)
  return null
}

/**
 * «Додати товар у кілька кліків»: замість створення рядка на кожну комбінацію
 * власниця обирає кольори й розміри, ставить галочку — і після збереження
 * отримує всю сітку варіацій з артикулами й однаковим стартовим залишком.
 * Далі залишки правляться точково.
 *
 * Наявні комбінації не перезаписуються, а галочка знімається сама — щоб
 * наступне збереження не затерло ручні правки.
 */
const generateVariants: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (!data.generateVariants) return data

  const colors = (Array.isArray(data.generateColors) ? data.generateColors : [])
    .map(asId)
    .filter((id): id is number => id !== null)
  const sizes = (Array.isArray(data.generateSizes) ? data.generateSizes : [])
    .map(asId)
    .filter((id): id is number => id !== null)

  if (colors.length === 0 && sizes.length === 0) {
    data.generateVariants = false
    return data
  }

  const stock = typeof data.generateStock === 'number' ? data.generateStock : 0
  const prefix = String(data.slug || originalDoc?.slug || 'mk').slice(0, 8).toUpperCase()

  const existing = new Map<string, Variant>()
  for (const variant of (Array.isArray(data.variants) ? data.variants : []) as Variant[]) {
    existing.set(`${asId(variant.color) ?? ''}-${asId(variant.size) ?? ''}`, variant)
  }

  const combos = (colors.length ? colors : [null]).flatMap((color) =>
    (sizes.length ? sizes : [null]).map((size) => ({ color, size })),
  )

  data.variants = combos.map((combo, index) => {
    const kept = existing.get(`${combo.color ?? ''}-${combo.size ?? ''}`)
    if (kept) return kept

    return {
      color: combo.color ?? undefined,
      size: combo.size ?? undefined,
      sku: `${prefix}-${String(index + 1).padStart(2, '0')}`,
      stock,
    }
  })

  data.generateVariants = false
  return data
}

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
  // Порядок важливий: спершу розкладаємо сітку варіацій, потім рахуємо
  // по ній ціну «від» і залишки.
  hooks: { beforeChange: [generateVariants, denormalise] },
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
              admin: {
                description:
                  'Перше фото — головне. Друге показується при наведенні на картку. Відео теж можна: у слайдері воно стане окремим кадром із кнопкою відтворення.',
              },
            },
            /*
              Галерея на кожен колір — як в Etsy: обрав колір, і слайдер
              показує саме його.

              Окремий масив, а не поле в самій варіації: варіація — це колір
              І розмір, тож той самий колір повторюється в кожному розмірі, і
              фото довелося б дублювати. Тут один рядок на колір.

              Порожньо — слайдер показує спільні «Фотографії», як і раніше.
              Заповнено не для всіх кольорів — ті, що лишились без свого
              набору, теж беруть спільні.
            */
            {
              name: 'colorGallery',
              type: 'array',
              label: 'Фото й відео за кольором',
              labels: { singular: 'Колір', plural: 'Кольори' },
              admin: {
                description:
                  'Коли покупець обирає колір, слайдер показує саме ці файли. Колір без свого набору показує спільні «Фотографії».',
              },
              fields: [
                {
                  name: 'color',
                  type: 'relationship',
                  relationTo: 'colors',
                  required: true,
                  label: 'Колір',
                },
                {
                  name: 'media',
                  type: 'upload',
                  relationTo: 'media',
                  hasMany: true,
                  required: true,
                  label: 'Фото й відео цього кольору',
                },
              ],
            },
            /*
              Ролик, який оживає при наведенні на картку в каталозі — як в Etsy.

              Окреме поле, а не перше відео з «Фотографій»: там галерея товару,
              і ролик потрапив би в неї кадром, який не гортається. Тут він має
              одну роботу й один розмір.

              Якщо відео немає, при наведенні показується друге фото — те саме,
              що обіцяє підказка вище. Немає й другого — лишається наближення.
            */
            {
              name: 'cardVideo',
              type: 'upload',
              relationTo: 'media',
              label: 'Відео для картки',
              admin: {
                description:
                  'Програється при наведенні на картку в каталозі: без звуку, по колу. До 15 МБ — це 10–20 секунд. Перше фото лишається тим, що видно до наведення.',
              },
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
              type: 'collapsible',
              label: 'Створити варіації за кольорами й розмірами',
              admin: {
                initCollapsed: true,
                description:
                  'Оберіть кольори й розміри, поставте галочку й збережіть — усі комбінації створяться самі.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'generateColors',
                      type: 'relationship',
                      relationTo: 'colors',
                      hasMany: true,
                      label: 'Кольори',
                      admin: { width: '50%' },
                    },
                    {
                      name: 'generateSizes',
                      type: 'relationship',
                      relationTo: 'sizes',
                      hasMany: true,
                      label: 'Розміри',
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'generateStock',
                      type: 'number',
                      label: 'Залишок на кожну комбінацію',
                      defaultValue: 1,
                      min: 0,
                      admin: { width: '50%' },
                    },
                    {
                      name: 'generateVariants',
                      type: 'checkbox',
                      label: 'Створити при збереженні',
                      defaultValue: false,
                      admin: {
                        width: '50%',
                        description: 'Наявні комбінації лишаться недоторканими.',
                      },
                    },
                  ],
                },
              ],
            },
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
    /*
      Звʼязок набору з курсом, якого йому бракувало.

      Досі слова «для МК "Прозора Криза"» жили лише в назві товару — для сайту
      це був звичайний текст. Сторінка курсу про набір не знала, і людина, яка
      щойно вирішила вчитись, ніде його не бачила.

      Поле в товарі, а не в курсі, бо так іде робота: курс заводять перший,
      набір до нього — потім. Кілька курсів навмисно: один набір бісеру
      годиться відразу для кількох МК.
    */
    {
      name: 'courses',
      type: 'relationship',
      relationTo: 'courses',
      hasMany: true,
      label: 'Для якого курсу',
      admin: {
        position: 'sidebar',
        description:
          'Набір зʼявиться на сторінці цих курсів і в каталозі навчання, якщо шукати набори.',
      },
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
    {
      name: 'suggestInCart',
      type: 'checkbox',
      label: 'Пропонувати в кошику',
      admin: {
        position: 'sidebar',
        description:
          'Блок «Може сподобатись» у кошику. Якщо не відмічено жодного товару, показується найдешевший із наявних.',
      },
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
