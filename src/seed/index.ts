import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Демонстраційне наповнення: щоб сайт можна було показати клієнтці до того,
 * як вона завантажить свої тексти й фото. Запуск: npm run seed
 */
const payload = await getPayload({ config })

const ADMIN_EMAIL = 'admin@mk.local'
const ADMIN_PASSWORD = 'mk-admin-2026'

const log = (message: string) => payload.logger.info(message)

// --- Адміністратор ------------------------------------------------------
const existingAdmins = await payload.find({ collection: 'users', limit: 1 })
if (existingAdmins.totalDocs === 0) {
  await payload.create({
    collection: 'users',
    data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: 'Власниця' },
  })
  log(`Створено адміністратора: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
}

// --- Напрями ------------------------------------------------------------
const DIRECTIONS = [
  {
    title: 'Вʼязання',
    slug: 'viazannia',
    tagline: 'Гачок і спиці',
    description: 'Від першої петлі до готової сумки чи топа.',
    order: 1,
  },
  {
    title: 'Бісероплетіння',
    slug: 'biseropletinnia',
    tagline: 'Дрібний бісер і волосінь',
    description: 'Браслети, кольє та сережки, які не соромно носити щодня.',
    order: 2,
  },
  {
    title: 'Макраме',
    slug: 'makrame',
    tagline: 'Вузли й шнур',
    description: 'Панно, кашпо й прикраси з натурального шнура.',
    order: 3,
  },
]

const directionIds: Record<string, number> = {}
for (const direction of DIRECTIONS) {
  const found = await payload.find({
    collection: 'course-directions',
    where: { slug: { equals: direction.slug } },
    limit: 1,
  })
  const doc =
    found.docs[0] ?? (await payload.create({ collection: 'course-directions', data: direction }))
  directionIds[direction.slug] = doc.id
}
log(`Напрями: ${Object.keys(directionIds).length}`)

// --- Курси --------------------------------------------------------------
const lessons = (count: number, prefix: string) =>
  Array.from({ length: count }, (_, i) => ({
    title: `${prefix} — частина ${i + 1}`,
    description: 'Відео, схема та рекомендації з матеріалів.',
  }))

const COURSES = [
  {
    title: 'Вʼязані сумки з трикотажної пряжі',
    slug: 'viazani-sumky',
    direction: 'viazannia',
    price: 890,
    oldPrice: 1200,
    tagline: '12 МК: від зразка до готової сумки з підкладкою',
    level: 'beginner' as const,
    lessons: lessons(12, 'Сумка'),
  },
  {
    title: 'Топи й бралетки гачком',
    slug: 'topy-hachkom',
    direction: 'viazannia',
    price: 750,
    tagline: '10 МК про посадку по фігурі',
    level: 'medium' as const,
    lessons: lessons(10, 'Топ'),
  },
  {
    title: 'Браслети з японського бісеру',
    slug: 'braslety-biser',
    direction: 'biseropletinnia',
    price: 650,
    tagline: '14 МК: техніки, схеми, застібки',
    level: 'beginner' as const,
    lessons: lessons(14, 'Браслет'),
  },
  {
    title: 'Кольє та чокери',
    slug: 'kolie-chokery',
    direction: 'biseropletinnia',
    price: 820,
    tagline: '11 МК про обʼємне плетіння',
    level: 'advanced' as const,
    lessons: lessons(11, 'Кольє'),
  },
  {
    title: 'Макраме: базові вузли',
    slug: 'makrame-baza',
    direction: 'makrame',
    price: 550,
    tagline: '10 МК, з яких починається все інше',
    level: 'beginner' as const,
    lessons: lessons(10, 'Вузол'),
  },
  {
    title: 'Панно й кашпо',
    slug: 'panno-kashpo',
    direction: 'makrame',
    price: 780,
    tagline: '13 МК для інтерʼєру',
    level: 'medium' as const,
    lessons: lessons(13, 'Панно'),
  },
]

for (const course of COURSES) {
  const found = await payload.find({
    collection: 'courses',
    where: { slug: { equals: course.slug } },
    limit: 1,
  })
  if (found.totalDocs > 0) continue

  await payload.create({
    collection: 'courses',
    data: {
      title: course.title,
      slug: course.slug,
      tagline: course.tagline,
      price: course.price,
      oldPrice: course.oldPrice,
      level: course.level,
      direction: directionIds[course.direction],
      status: 'published',
      featured: true,
      accessType: 'telegram',
      lessons: course.lessons,
      faq: [
        {
          question: 'Скільки часу є доступ?',
          answer: 'Назавжди. Ви заходите в канал і повертаєтесь до матеріалів коли завгодно.',
        },
        {
          question: 'Чи потрібен досвід?',
          answer: 'Ні. Перші МК саме про те, як тримати інструмент і читати схему.',
        },
      ],
    },
  })
}
log(`Курси: ${COURSES.length}`)

// --- Кольори й розміри --------------------------------------------------
const COLORS = [
  { title: 'Молочний', slug: 'molochnyi', hex: '#EFE9DF' },
  { title: 'Полин', slug: 'polyn', hex: '#8E9A85' },
  { title: 'Індиго', slug: 'indyho', hex: '#2C3A52' },
  { title: 'Пудра', slug: 'pudra', hex: '#D9B7AC' },
  { title: 'Графіт', slug: 'hrafit', hex: '#3A3733' },
]

const colorIds: Record<string, number> = {}
for (const color of COLORS) {
  const found = await payload.find({ collection: 'colors', where: { slug: { equals: color.slug } }, limit: 1 })
  const doc = found.docs[0] ?? (await payload.create({ collection: 'colors', data: color }))
  colorIds[color.slug] = doc.id
}

const SIZES = [
  { title: 'S', slug: 's', order: 1 },
  { title: 'M', slug: 'm', order: 2 },
  { title: 'L', slug: 'l', order: 3 },
]
const sizeIds: Record<string, number> = {}
for (const size of SIZES) {
  const found = await payload.find({ collection: 'sizes', where: { slug: { equals: size.slug } }, limit: 1 })
  const doc = found.docs[0] ?? (await payload.create({ collection: 'sizes', data: size }))
  sizeIds[size.slug] = doc.id
}

// --- Категорії ----------------------------------------------------------
const CATEGORIES = [
  { title: 'Готові прикраси', slug: 'prykrasy' },
  { title: 'Набори для створення', slug: 'nabory' },
  { title: 'Матеріали', slug: 'materialy' },
]
const categoryIds: Record<string, number> = {}
for (const category of CATEGORIES) {
  const found = await payload.find({
    collection: 'categories',
    where: { slug: { equals: category.slug } },
    limit: 1,
  })
  const doc = found.docs[0] ?? (await payload.create({ collection: 'categories', data: category }))
  categoryIds[category.slug] = doc.id
}

// --- Товари -------------------------------------------------------------
const PRODUCTS = [
  {
    title: 'Браслет «Полин»',
    slug: 'braslet-polyn',
    category: 'prykrasy',
    price: 420,
    colors: ['polyn', 'molochnyi', 'indyho'],
    sizes: ['s', 'm'],
  },
  {
    title: 'Кольє з японського бісеру',
    slug: 'kolie-biser',
    category: 'prykrasy',
    price: 890,
    colors: ['molochnyi', 'pudra'],
    sizes: ['m'],
  },
  {
    title: 'Сережки-плетінки',
    slug: 'serezhky-pletinky',
    category: 'prykrasy',
    price: 350,
    colors: ['hrafit', 'indyho', 'pudra'],
    sizes: [],
  },
  {
    title: 'Чокер із шнура',
    slug: 'choker-shnur',
    category: 'prykrasy',
    price: 480,
    colors: ['molochnyi', 'hrafit'],
    sizes: ['s', 'm', 'l'],
  },
  {
    title: 'Набір для плетіння браслета',
    slug: 'nabir-braslet',
    category: 'nabory',
    price: 690,
    colors: ['pudra', 'polyn'],
    sizes: [],
    isKit: true,
  },
  {
    title: 'Набір «Перше макраме»',
    slug: 'nabir-makrame',
    category: 'nabory',
    price: 750,
    colors: ['molochnyi'],
    sizes: [],
    isKit: true,
  },
]

for (const product of PRODUCTS) {
  const found = await payload.find({
    collection: 'products',
    where: { slug: { equals: product.slug } },
    limit: 1,
  })
  if (found.totalDocs > 0) continue

  const variants = product.colors.flatMap((color, colorIndex) =>
    (product.sizes.length ? product.sizes : [null]).map((size, sizeIndex) => ({
      color: colorIds[color],
      size: size ? sizeIds[size] : undefined,
      sku: `${product.slug.slice(0, 8).toUpperCase()}-${colorIndex + 1}${sizeIndex + 1}`,
      stock: [4, 2, 0, 7, 3][(colorIndex + sizeIndex) % 5],
    })),
  )

  await payload.create({
    collection: 'products',
    data: {
      title: product.title,
      slug: product.slug,
      price: product.price,
      category: categoryIds[product.category],
      status: 'published',
      featured: true,
      isKit: Boolean(product.isKit),
      shortDescription: 'Ручна робота. Кожен виріб трохи відрізняється — це не дефект, а ознака хендмейду.',
      variants,
    },
  })
}
log(`Товари: ${PRODUCTS.length}`)

// --- Відгуки ------------------------------------------------------------
const REVIEWS = [
  {
    authorName: 'Оксана',
    rating: 5,
    text: 'Оплатила ввечері, доступ прийшов за хвилину. Схеми зрозумілі навіть мені, я до цього гачок в руках не тримала.',
    status: 'approved' as const,
  },
  {
    authorName: 'Марʼяна',
    rating: 5,
    text: 'Браслет прийшов Новою Поштою за два дні, упакований гарно. Колір саме такий, як на фото.',
    status: 'approved' as const,
  },
  {
    authorName: 'Ірина',
    rating: 5,
    text: 'Купила набір доньці на день народження. Вона зробила браслет за вечір і тепер просить другий.',
    status: 'approved' as const,
  },
]

const existingReviews = await payload.find({ collection: 'reviews', limit: 1 })
if (existingReviews.totalDocs === 0) {
  for (const review of REVIEWS) await payload.create({ collection: 'reviews', data: review })
}

// --- Налаштування -------------------------------------------------------
await payload.updateGlobal({
  slug: 'settings',
  data: {
    announcement: 'Безкоштовна доставка від 1500 ₴',
    heroTitle: 'Прикраси ручної роботи. І курси, щоб зробити свою.',
    heroSubtitle: 'Вʼязання, бісероплетіння й макраме — від першої петлі до готової прикраси.',
    instagram: 'https://instagram.com/',
    telegram: 'https://t.me/',
    phone: '+38 (000) 000-00-00',
    freeDeliveryFrom: 1500,
    prepaymentAmount: 200,
  },
})

log('Готово.')
process.exit(0)
