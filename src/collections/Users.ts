import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

/** Адміністратори сайту (власниця бренду та її команда). */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Адміністратор', plural: 'Адміністратори' },
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Налаштування',
  },
  access: {
    create: isAdmin,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
    admin: ({ req }) => req.user?.collection === 'users',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: "Ім'я",
    },
  ],
}
