import type { CollectionConfig } from 'payload'

import { anyone, isAdmin } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Зображення', plural: 'Медіа' },
  admin: { group: 'Контент' },
  access: { read: anyone, create: isAdmin, update: isAdmin, delete: isAdmin },
  upload: {
    mimeTypes: ['image/*', 'video/*'],
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 320, height: 320, position: 'centre' },
      { name: 'card', width: 640 },
      { name: 'wide', width: 1280 },
      { name: 'hero', width: 2000 },
    ],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Опис зображення',
      admin: {
        description: 'Що зображено. Потрібно для Google і для людей, які користуються читалками екрана.',
      },
    },
  ],
}
