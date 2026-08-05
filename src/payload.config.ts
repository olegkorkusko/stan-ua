import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { en } from '@payloadcms/translations/languages/en'
import { uk } from '@payloadcms/translations/languages/uk'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Categories, Colors, Sizes } from './collections/Attributes'
import { Broadcasts } from './collections/Broadcasts'
import { Carts } from './collections/Carts'
import { Pages, Posts, Subscribers } from './collections/Content'
import { CourseDirections, Courses } from './collections/Courses'
import { Customers } from './collections/Customers'
import { PromoCodes, Reviews } from './collections/Marketing'
import { Media } from './collections/Media'
import { Orders } from './collections/Orders'
import { Products } from './collections/Products'
import { Users } from './collections/Users'
import { Settings } from './globals/Settings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const hasS3 = Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID)

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' · MK',
    },
  },
  collections: [
    Products,
    Categories,
    Colors,
    Sizes,
    Courses,
    CourseDirections,
    Orders,
    Carts,
    Customers,
    PromoCodes,
    Broadcasts,
    Reviews,
    Pages,
    Posts,
    Subscribers,
    Media,
    Users,
  ],
  globals: [Settings],
  editor: lexicalEditor(),
  // Мова адмінки — українська. Англійська лишається для розробників.
  i18n: {
    supportedLanguages: { uk, en },
    fallbackLanguage: 'uk',
  },
  // Контент сайту двомовний: українська основна, англійська додається пізніше
  // під переозвучені курси.
  localization: {
    locales: [
      { label: 'Українська', code: 'uk' },
      { label: 'English', code: 'en' },
    ],
    defaultLocale: 'uk',
    fallback: true,
  },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
  }),
  // Без ключа Resend листи просто пишуться в консоль — розробка не залежить
  // від зовнішнього сервісу.
  ...(process.env.RESEND_API_KEY
    ? {
        email: resendAdapter({
          defaultFromAddress: process.env.EMAIL_FROM || 'noreply@mk.ua',
          defaultFromName: 'МК',
          apiKey: process.env.RESEND_API_KEY,
        }),
      }
    : {}),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  sharp,
  plugins: hasS3
    ? [
        s3Storage({
          collections: { media: true },
          bucket: process.env.S3_BUCKET as string,
          config: {
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID as string,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY as string,
            },
            region: process.env.S3_REGION,
            ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT, forcePathStyle: true } : {}),
          },
        }),
      ]
    : [],
})
