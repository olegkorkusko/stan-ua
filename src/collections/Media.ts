import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Зображення', plural: 'Медіа' },
  admin: {
    group: 'Контент',
    description:
      'Фото зменшуються й стискаються самі — вантажте як є, з телефона теж. Максимум 15 МБ на файл; якщо більше, завантаження обірветься.',
  },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  upload: {
    mimeTypes: ['image/*', 'video/*'],
    focalPoint: true,
    /*
      Знімок із телефона — це 4–6 МБ і 4000 px завширшки. Такий розмір на
      сайті не потрібен ніде: найбільший кадр у нас 2000 px. Тому зменшуємо
      саме оригінал, а не лише робимо з нього копії — інакше він усе одно
      лежить у сховищі й інколи віддається браузеру.

      withoutEnlargement: маленьке фото не розтягуємо, від цього воно лише
      розмивається й важчає.
    */
    resizeOptions: { width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true },
    /*
      WebP замість JPEG і PNG. Те саме зображення важить утричі менше, а
      різниці на око немає. Формат задається і для оригіналу, і для кожного
      розміру окремо — Payload не успадковує його вниз.
    */
    formatOptions: { format: 'webp', options: { quality: 82 } },
    imageSizes: [
      {
        name: 'thumbnail',
        width: 320,
        height: 320,
        position: 'centre',
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      { name: 'card', width: 640, formatOptions: { format: 'webp', options: { quality: 82 } } },
      { name: 'wide', width: 1280, formatOptions: { format: 'webp', options: { quality: 82 } } },
      { name: 'hero', width: 2000, formatOptions: { format: 'webp', options: { quality: 80 } } },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Опис зображення',
      // Цей текст читає покупець — його озвучує читалка екрана й індексує
      // Google. На англійській версії сайту він має бути англійською, інакше
      // незрячий відвідувач чує українську посеред англійської сторінки.
      localized: true,
      admin: {
        description: 'Що зображено. Потрібно для Google і для людей, які користуються читалками екрана.',
      },
    },
  ],
}
