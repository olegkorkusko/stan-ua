import config from '@payload-config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'

/**
 * Завантажує демонстраційні фото з seed-assets/ у медіатеку й розставляє їх
 * по сайту. Це тимчасові знімки з Unsplash — клієнтка замінить їх власними,
 * авторство лежить у seed-assets/manifest.json.
 *
 * Запуск: npm run seed:photos
 */
const payload = await getPayload({ config })

const ASSETS = path.resolve(process.cwd(), 'seed-assets')

type Credit = { file: string; alt: string; author: string; authorUrl: string; photoUrl: string }

const credits: Credit[] = JSON.parse(
  fs.readFileSync(path.join(ASSETS, 'manifest.json'), 'utf-8'),
) as Credit[]

const creditFor = (file: string) => credits.find((item) => item.file === file)

/** Ідемпотентно: повторний запуск не плодить дублікати в медіатеці. */
const upload = async (file: string, alt: string): Promise<number | null> => {
  const filePath = path.join(ASSETS, file)
  if (!fs.existsSync(filePath)) {
    payload.logger.warn(`Немає файлу ${file}`)
    return null
  }

  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: file } },
    limit: 1,
  })
  if (existing.docs[0]) return existing.docs[0].id

  const credit = creditFor(file)
  const doc = await payload.create({
    collection: 'media',
    filePath,
    data: {
      alt: credit ? `${alt} (фото: ${credit.author}, Unsplash)` : alt,
    },
  })
  return doc.id
}

const setIfEmpty = async <T extends 'course-directions' | 'courses' | 'products' | 'posts' | 'pages'>(
  collection: T,
  slug: string,
  data: Record<string, unknown>,
) => {
  const found = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1 })
  const doc = found.docs[0]
  if (!doc) return false
  await payload.update({ collection, id: doc.id, data: data as never })
  return true
}

// --- Головна ------------------------------------------------------------
const heroId = await upload('hero.jpg', 'Робота з макраме')
if (heroId) await payload.updateGlobal({ slug: 'settings', data: { heroMedia: heroId } })

// --- Напрями ------------------------------------------------------------
const DIRECTIONS: [string, string, string][] = [
  ['viazannia', 'dir-knit.jpg', 'Вʼязання'],
  ['biseropletinnia', 'dir-bead.jpg', 'Бісероплетіння'],
  ['makrame', 'dir-macrame.jpg', 'Макраме'],
]

for (const [slug, file, alt] of DIRECTIONS) {
  const id = await upload(file, alt)
  if (id) await setIfEmpty('course-directions', slug, { image: id })
}

// --- Курси --------------------------------------------------------------
const COURSES = [
  'viazani-sumky',
  'topy-hachkom',
  'braslety-biser',
  'kolie-chokery',
  'makrame-baza',
  'panno-kashpo',
  'zhakardovi-svetry',
  'broshi-biser',
  'velyki-panno',
]

// Знімків у seed-assets рівно шість, а курсів більше, тож обкладинки йдуть
// по колу. Для демонстраційних даних це прийнятно: клієнтка все одно замінить
// їх власними фото.
const COURSE_PHOTOS = 6

for (const [index, slug] of COURSES.entries()) {
  const photo = (index % COURSE_PHOTOS) + 1
  const cover = await upload(`course-${photo}.jpg`, 'Майстер-клас')
  const gallery = await upload(`product2-${photo}.jpg`, 'Робота учениці')
  if (cover) await setIfEmpty('courses', slug, { cover, gallery: gallery ? [gallery] : [] })
}

// --- Товари: по два фото, друге показується при наведенні ---------------
const PRODUCTS = [
  'braslet-polyn',
  'kolie-biser',
  'serezhky-pletinky',
  'choker-shnur',
  'nabir-braslet',
  'nabir-makrame',
]

for (const [index, slug] of PRODUCTS.entries()) {
  const first = await upload(`product-${index + 1}.jpg`, 'Прикраса ручної роботи')
  const second = await upload(`product-${index + 3 > 8 ? index - 1 : index + 3}.jpg`, 'Прикраса ручної роботи')
  const images = [first, second].filter((id): id is number => typeof id === 'number')
  if (images.length) await setIfEmpty('products', slug, { images })
}

// --- Журнал і сторінки ---------------------------------------------------
const POSTS = ['z-choho-pochaty-viazannia', 'yak-doglyadaty-za-prykrasamy', 'podarunok-svoimy-rukamy']
for (const [index, slug] of POSTS.entries()) {
  const cover = await upload(`journal-${index + 1}.jpg`, 'Майстерня')
  if (cover) await setIfEmpty('posts', slug, { cover })
}

// Про бренд живе глобалом, а не сторінкою в колекції: у макеті (94:2011)
// в неї власна верстка, якої rich text не описує.
const aboutPhoto = await upload('page-1.jpg', 'Майстерня')
if (aboutPhoto) await payload.updateGlobal({ slug: 'about', data: { photo: aboutPhoto } })

const deliveryCover = await upload('page-2.jpg', 'Пакування замовлення')
if (deliveryCover) await setIfEmpty('pages', 'delivery', { cover: deliveryCover })

const total = await payload.count({ collection: 'media' })
payload.logger.info(`Медіатека: ${total.totalDocs} файлів`)
payload.logger.info('Готово.')

process.exit(0)
