import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/access'

/** Адміністратори сайту (власниця бренду та її команда). */
export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'Адміністратор', plural: 'Адміністратори' },
  auth: {
    forgotPassword: {
      // Стандартний лист Payload англійський і веде на serverURL. Свій —
      // українською й із явною адресою, щоб не залежати від конфігурації.
      generateEmailSubject: () => 'Відновлення пароля — адмінка STAN_UA',
      generateEmailHTML: (args) => {
        const base = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'
        const link = `${base}/admin/reset/${args?.token}`
        return [
          '<p>Вітаємо!</p>',
          '<p>Щоб задати новий пароль до адмінки, перейдіть за посиланням:</p>',
          `<p><a href="${link}">${link}</a></p>`,
          '<p>Посилання діє годину. Якщо ви його не запитували — просто проігноруйте лист.</p>',
        ].join('')
      },
    },
  },
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
