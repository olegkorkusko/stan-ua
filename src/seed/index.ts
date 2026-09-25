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

// --- Демо-покупець ------------------------------------------------------
// Потрібен, щоб можна було перевірити кабінет і «Обране»: без сесії покупця
// серце на картці лише веде на сторінку входу, а саме збереження не працює.
const CUSTOMER_EMAIL = 'customer@mk.local'
const CUSTOMER_PASSWORD = 'mk-customer-2026'

const existingCustomers = await payload.find({
  collection: 'customers',
  where: { email: { equals: CUSTOMER_EMAIL } },
  limit: 1,
})
if (existingCustomers.totalDocs === 0) {
  await payload.create({
    collection: 'customers',
    data: {
      email: CUSTOMER_EMAIL,
      password: CUSTOMER_PASSWORD,
      // Імʼя й телефон — з макета кабінету (138:3273, 138:3276), щоб екран
      // «Дані для доставки» було з чим звіряти.
      name: 'Ліда Мороз',
      phone: '+38 (067) 000-00-00',
    },
  })
  log(`Створено покупця: ${CUSTOMER_EMAIL} / ${CUSTOMER_PASSWORD}`)
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
  // Далі — три курси, які добивають матрицю «напрям × рівень» до повної.
  // Без них кожна друга комбінація фільтра порожня, і перевірити каталог
  // нічим: «Вʼязання + просунутий» чи «Макраме + просунутий» не дали б нічого.
  {
    title: 'Жакардові светри',
    slug: 'zhakardovi-svetry',
    direction: 'viazannia',
    price: 1150,
    tagline: '15 МК: кілька ниток одночасно й розрахунок візерунка',
    level: 'advanced' as const,
    lessons: lessons(15, 'Жакард'),
  },
  {
    title: 'Броші з бісеру',
    slug: 'broshi-biser',
    direction: 'biseropletinnia',
    price: 700,
    oldPrice: 900,
    tagline: '9 МК про обʼємні форми й кріплення',
    level: 'medium' as const,
    lessons: lessons(9, 'Брошка'),
  },
  {
    title: 'Великі панно макраме',
    slug: 'velyki-panno',
    direction: 'makrame',
    price: 980,
    tagline: '12 МК: композиція, каркас і робота на стіні',
    level: 'advanced' as const,
    lessons: lessons(12, 'Панно'),
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

// --- Кабінет демо-покупця -----------------------------------------------
/*
  Наповнюємо кабінет: без куплених доступів і збережених курсів усі три його
  вкладки показують порожні стани, і ні подивитись верстку, ні звірити її з
  макетом неможливо.

  Додаємо, а не замінюємо: те, що покупець уже купив чи зберіг, лишається на
  місці — seed у цьому проєкті запускають і на базі, у якій уже щось є.
*/
const demo = (
  await payload.find({
    collection: 'customers',
    where: { email: { equals: CUSTOMER_EMAIL } },
    limit: 1,
    overrideAccess: true,
  })
).docs[0]

if (demo) {
  const courseIds = async (slugs: string[]): Promise<number[]> => {
    const found = await payload.find({
      collection: 'courses',
      where: { slug: { in: slugs } },
      limit: slugs.length,
      depth: 0,
      overrideAccess: true,
    })
    return found.docs.map((course) => course.id)
  }

  const access = demo.access ?? []
  const owned = new Set(
    access.map((item) => (typeof item.course === 'object' ? item.course?.id : item.course)),
  )
  const grants = (await courseIds(['viazani-sumky', 'braslety-biser', 'makrame-baza']))
    .filter((id) => !owned.has(id))
    .map((course) => ({
      course,
      grantedAt: new Date().toISOString(),
      telegramInviteLink: `https://t.me/+demo${course}`,
    }))

  const savedNow = (demo.savedCourses ?? []).map((item) =>
    typeof item === 'object' ? item.id : item,
  )
  const saved = await courseIds(['velyki-panno', 'broshi-biser', 'topy-hachkom', 'panno-kashpo'])

  await payload.update({
    collection: 'customers',
    id: demo.id,
    overrideAccess: true,
    data: {
      name: 'Ліда Мороз',
      phone: '+38 (067) 000-00-00',
      access: [...access, ...grants],
      savedCourses: [...new Set([...savedNow, ...saved])],
      // Профіль доставки — те, що показує вкладка «Дані для доставки».
      // Значення з макета (138:3268), щоб було з чим звіряти.
      deliveryMethod: demo.deliveryMethod ?? 'np_branch',
      deliveryCity: demo.deliveryCity ?? 'Київ',
      deliveryBranch: demo.deliveryBranch ?? '№ 24, вул. Хрещатик, 1',
      paymentMethod: demo.paymentMethod ?? 'card',
      cardMask: demo.cardMask ?? '4242',
    },
  })
  log('Кабінет демо-покупця наповнено')
}

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
/*
  Кожен відгук ОБОВʼЯЗКОВО прив'язаний до товару або курсу. Сторінки шукають
  їх саме за цим зв'язком — where: { product: { equals: id } } на сторінці
  товару й course на сторінці курсу, — тож відгук без прив'язки просто лежить
  у базі й ніде не показується. Саме так і було: перші три відгуки сид
  створював без product/course, і на сайті їх ніхто не бачив.

  Оцінки навмисно не всі пʼятірки: із самих пʼятірок середній бал завжди 5.0,
  і не видно, чи він узагалі рахується.
*/
type SeedReview = {
  authorName: string
  /** Місто — частина підпису в макеті: «ОКСАНА · КИЇВ». */
  city?: string
  rating: number
  text: string
  /** Слаг товару АБО курсу — рівно одне з двох. */
  product?: string
  course?: string
  status?: 'approved' | 'pending'
}

const REVIEWS: SeedReview[] = [
  // Товари
  {
    authorName: 'Марʼяна',
    city: 'Львів',
    rating: 5,
    text: 'Браслет прийшов Новою Поштою за два дні, упакований гарно. Колір саме такий, як на фото.',
    product: 'braslet-polyn',
  },
  {
    authorName: 'Ірина',
    city: 'Одеса',
    rating: 5,
    text: 'Купила набір доньці на день народження. Вона зробила браслет за вечір і тепер просить другий.',
    product: 'nabir-braslet',
  },
  {
    authorName: 'Леся',
    city: 'Київ',
    rating: 5,
    text: 'Усе для першого панно в одній коробці, навіть кільце. Інструкція коротка, але зрозуміла.',
    product: 'nabir-makrame',
  },
  {
    authorName: 'Тетяна',
    city: 'Дніпро',
    rating: 4,
    text: 'Набір гарний, але шнура впритул — на переробку помилки вже не лишилось.',
    product: 'nabir-makrame',
  },
  {
    authorName: 'Аліна',
    city: 'Полтава',
    rating: 5,
    text: 'Носила все літо, шнур не розтягнувся й застібка тримає.',
    product: 'choker-shnur',
  },
  {
    authorName: 'Юлія',
    city: 'Житомир',
    rating: 5,
    text: 'Легенькі, вуха зовсім не тягне. Беру вже другу пару.',
    product: 'serezhky-pletinky',
  },
  {
    authorName: 'Надія',
    city: 'Рівне',
    rating: 4,
    text: 'Гарні, але менші, ніж я уявляла з фото. Раджу дивитись на розміри.',
    product: 'serezhky-pletinky',
  },
  {
    authorName: 'Христина',
    city: 'Вінниця',
    rating: 5,
    text: 'Замовляла на весілля сестри. Бісер переливається так, що всі питали, де брала.',
    product: 'kolie-biser',
  },

  // Курси
  {
    authorName: 'Оксана',
    city: 'Київ',
    rating: 5,
    text: 'Оплатила ввечері, доступ прийшов за хвилину. Схеми зрозумілі навіть мені, я до цього гачок в руках не тримала.',
    course: 'viazani-sumky',
  },
  {
    authorName: 'Софія',
    city: 'Харків',
    rating: 5,
    text: 'Почала з нуля, за два тижні звʼязала кашпо. Відео спокійне, без зайвої води.',
    course: 'makrame-baza',
  },
  {
    authorName: 'Вікторія',
    city: 'Чернівці',
    rating: 4,
    text: 'Матеріал добрий, але хотілося б більше про вибір шнура.',
    course: 'makrame-baza',
  },
  {
    authorName: 'Даринка',
    city: 'Тернопіль',
    rating: 5,
    text: 'Схеми чіткі, кожен ряд видно. Зробила чотири браслети за вихідні.',
    course: 'braslety-biser',
  },
  {
    authorName: 'Олена',
    city: 'Ужгород',
    rating: 5,
    text: 'Складніше, ніж очікувала, але саме тому й цікаво. Пояснення детальні.',
    course: 'kolie-chokery',
  },
  {
    authorName: 'Марина',
    city: 'Черкаси',
    rating: 5,
    text: 'Нарешті зрозуміла, як рахувати посадку. Топ сів ідеально.',
    course: 'topy-hachkom',
  },
  {
    authorName: 'Ангеліна',
    city: 'Суми',
    rating: 5,
    text: 'Зробила три кашпо на подарунки. Усі в захваті.',
    course: 'panno-kashpo',
  },
  {
    authorName: 'Наталя',
    city: 'Луцьк',
    rating: 5,
    text: 'Про каркас і композицію — саме те, чого бракувало в базовому курсі.',
    course: 'velyki-panno',
  },
  {
    authorName: 'Ярина',
    city: 'Івано-Франківськ',
    rating: 4,
    text: 'Курс сильний, але для початківців точно ні. Треба вже впевнено вʼязати.',
    course: 'zhakardovi-svetry',
  },
  {
    // Навмисно на модерації: колекція обіцяє, що нові відгуки не показуються
    // до схвалення, і це має бути чим перевірити.
    authorName: 'Катерина',
    city: 'Миколаїв',
    rating: 5,
    text: 'Щойно почала, поки все зрозуміло. Допишу, як закінчу.',
    course: 'broshi-biser',
    status: 'pending',
  },
]

const idBySlug = async (collection: 'products' | 'courses', slugs: string[]) => {
  const map = new Map<string, number>()
  for (const slug of slugs) {
    const found = await payload.find({ collection, where: { slug: { equals: slug } }, limit: 1 })
    if (found.docs[0]) map.set(slug, found.docs[0].id)
  }
  return map
}

const productIds = await idBySlug(
  'products',
  [...new Set(REVIEWS.map((review) => review.product).filter((slug): slug is string => Boolean(slug)))],
)
const courseIds = await idBySlug(
  'courses',
  [...new Set(REVIEWS.map((review) => review.course).filter((slug): slug is string => Boolean(slug)))],
)

let writtenReviews = 0
for (const review of REVIEWS) {
  const productId = review.product ? productIds.get(review.product) : undefined
  const courseId = review.course ? courseIds.get(review.course) : undefined
  if (!productId && !courseId) {
    payload.logger.warn(`Відгук «${review.authorName}»: не знайшов товару/курсу, пропускаю`)
    continue
  }

  const data = {
    authorName: review.authorName,
    city: review.city,
    rating: review.rating,
    text: review.text,
    status: review.status ?? ('approved' as const),
    product: productId,
    course: courseId,
  }

  // Шукаємо по тексту, а не по імені: імена повторюються, текст — ні.
  // Наявний відгук оновлюємо, а не пропускаємо: так лагодяться старі записи,
  // створені без прив'язки до товару чи курсу.
  const found = await payload.find({
    collection: 'reviews',
    where: { text: { equals: review.text } },
    limit: 1,
  })

  if (found.docs[0]) {
    await payload.update({ collection: 'reviews', id: found.docs[0].id, data })
  } else {
    await payload.create({ collection: 'reviews', data })
  }
  writtenReviews += 1
}
log(`Відгуки: ${writtenReviews}`)

// --- Налаштування -------------------------------------------------------
await payload.updateGlobal({
  slug: 'settings',
  data: {
    announcement: 'Безкоштовна доставка від 1500 ₴',
    instagram: 'https://instagram.com/',
    telegram: 'https://t.me/',
    phone: '+38 (000) 000-00-00',
    freeDeliveryFrom: 1500,
  },
})

log('Готово.')
process.exit(0)
