import config from '@payload-config'
import fs from 'fs'
import path from 'path'
import { getPayload } from 'payload'

/**
 * Перенос справжніх курсів із сайтів клієнтки на Weblium.
 *
 * До цього в базі лежали десять вигаданих курсів із seed/index.ts — вони
 * потрібні були, поки не було справжнього контенту. Тепер є: три курси
 * (вʼязання, макраме, бісероплетіння) і два окремі МК, з цінами, складом МК
 * і фото з самих сайтів.
 *
 * Джерела: mk.weblium.site, 2rsnb.weblium.site, stanua.weblium.site,
 * bfutc.weblium.site, stan-ua.weblium.site.
 *
 * Курси створюються ЧЕРНЕТКАМИ. Опублікувати їх не можна, поки не вказано
 * ID Telegram-каналу: цього не дає зробити хук verifyChannel у Courses.ts, і
 * правильно робить — інакше курс продається, а доступ видати нікому.
 *
 * Запуск: npm run seed:courses
 */
const payload = await getPayload({ config })

const ASSETS = path.resolve(process.cwd(), 'seed-assets/courses')

/** Лексикал приймає структуру редактора, тому абзаци збираємо програмно. */
const richText = (blocks: { type: 'h2' | 'p'; text: string }[]) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
    children: blocks.map((block) => ({
      type: 'heading',
      ...(block.type === 'h2' ? { tag: 'h2' } : { type: 'paragraph' }),
      format: '' as const,
      indent: 0,
      version: 1,
      direction: 'ltr' as const,
      children: [
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: block.text,
          version: 1,
        },
      ],
    })),
  },
})

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

  const doc = await payload.create({ collection: 'media', filePath, data: { alt } })
  return doc.id
}

// --- Напрями -------------------------------------------------------------
const directionIds: Record<string, number> = {}
for (const slug of ['viazannia', 'biseropletinnia', 'makrame']) {
  const found = await payload.find({
    collection: 'course-directions',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  const doc = found.docs[0]
  if (!doc) throw new Error(`Немає напряму ${slug}`)
  directionIds[slug] = doc.id
}

// --- Справжні курси ------------------------------------------------------
type Course = {
  slug: string
  title: string
  tagline: string
  direction: keyof typeof directionIds
  price: number
  oldPrice?: number
  featured: boolean
  description: { type: 'h2' | 'p'; text: string }[]
  lessons: { title: string; description?: string }[]
  faq?: { question: string; answer: string }[]
  cover: string
  gallery?: string[]
  alt: string
}

const COURSES: Course[] = [
  {
    slug: 'kurs-viazannia',
    title: 'Курс з вʼязання речей',
    tagline: '6 МК для новачків: жилетка, сумка, плед, кардигани, топ',
    direction: 'viazannia',
    price: 270,
    featured: true,
    description: [
      {
        type: 'p',
        text: 'Курс по вʼязанню стильових речей власними руками. Ви створите неперевершені та мʼякі образи разом з нами.',
      },
      {
        type: 'p',
        text: 'Усі майстер-класи — для новачків, без попереднього досвіду. Показуємо все на відео, від першого до останнього кроку, і розказуємо про матеріали та де їх придбати.',
      },
      {
        type: 'p',
        text: 'Пряжа, ваші руки, наш курс — і у вас безліч речей, які носити, дарувати або виготовляти на продаж.',
      },
      { type: 'h2', text: 'Доступ назавжди' },
      {
        type: 'p',
        text: 'По мірі додавання нових МК ціна буде збільшуватись, але для тих, хто придбав зараз, нові МК відкриваються автоматично та безкоштовно.',
      },
    ],
    lessons: [
      { title: 'Жилетка з милими квітами' },
      { title: 'Сумка' },
      { title: 'Плед' },
      { title: 'Кардиган — перший тип' },
      { title: 'Кардиган — другий тип' },
      { title: 'Топ' },
    ],
    cover: 'course-knit-cover.jpg',
    gallery: ['course-knit-1.jpg'],
    alt: 'Вʼязаний кардиган ручної роботи',
  },
  {
    slug: 'kurs-makrame',
    title: 'Курс по макраме',
    tagline: '12 МК — від хустки до шолдера. Нові додаються без доплат',
    direction: 'makrame',
    price: 320,
    oldPrice: 1500,
    featured: true,
    description: [
      {
        type: 'p',
        text: 'На курсі вже 12 майстер-класів, і нові додаються автоматично для учасників без доплат.',
      },
      {
        type: 'p',
        text: 'Плетемо від простого до складного: хустка, поясок, шарф, топ-накидка, етно-комплект, кольє з блискучих шнурів і шолдер з довгими тороками на плечі.',
      },
    ],
    lessons: [
      { title: 'Хустка' },
      { title: 'Поясок' },
      { title: 'Сердечко-брошка' },
      { title: 'Шарф' },
      { title: 'Топ-накидка' },
      { title: 'Етно комплект' },
      { title: 'Кольє та браслет з блискучих шнурів' },
      { title: 'Комплект з квітковими завʼязками: топ, сережки, браслет' },
      { title: 'Культова припинда' },
      { title: 'Шолдер — чокер з довгими тороками на плечі' },
    ],
    cover: 'course-macrame-cover.jpg',
    gallery: ['course-macrame-1.jpg', 'course-macrame-2.jpg'],
    alt: 'Прикраса з макраме ручної роботи',
  },
  {
    slug: 'sekretnyi-kanal-biser',
    title: '«Секретний канал» з бісероплетіння',
    tagline: '13 МК у різних техніках. Нові — без доплат',
    direction: 'biseropletinnia',
    price: 1500,
    oldPrice: 4500,
    featured: true,
    description: [
      {
        type: 'p',
        text: 'На каналі вже 13 майстер-класів — плетіння в різних техніках. Якщо купувати кожен МК окремо, це 4500 грн. Вигода 3000 грн, і за нові майстер-класи доплачувати не треба.',
      },
      {
        type: 'p',
        text: 'На канал будуть додаватися МК по Борщівському язику, чокеру та базових силянках, а також освітні відео про те, як створити власний дизайн. З кожним новим МК вартість курсу зростатиме.',
      },
      { type: 'h2', text: 'Чому саме наші МК' },
      {
        type: 'p',
        text: 'Ідеально для новачків: усе просто та покроково. Творчість, яка заспокоює та надихає. Сотні позитивних відгуків і тисячі створених прикрас.',
      },
      { type: 'h2', text: 'Оплата — єдиноразова, доступ — назавжди' },
      {
        type: 'p',
        text: 'Ми створили безліч МК, і вже тисячі жінок сплели свої шедеври з нуля. Приєднуйтесь до нашого кола — створюйте спадщину.',
      },
    ],
    lessons: [
      { title: 'Прозорий комір' },
      { title: 'Браслет з підвісами' },
      { title: 'Ювелірні мікроквіти' },
      { title: 'Різдвяні кульки' },
      { title: 'Велика квітка на шию' },
      { title: 'Золота криза' },
      { title: 'Браслети: цегляне плетіння' },
      { title: 'Базова силянка' },
      { title: 'Червона криза з тороками' },
      { title: 'Мереживний чокер' },
      { title: 'Парні браслети' },
      { title: 'Золота зірка' },
      { title: 'Кришталевий комір' },
    ],
    faq: [
      {
        question: 'Що я отримаю після оплати?',
        answer:
          'Доступ до телеграм-каналу з усіма матеріалами: програми МК, відео плетіння, схеми та кольорові рішення, описи й номери бісеру, посилання на магазини бісеру.',
      },
      {
        question: 'Чи треба доплачувати за нові майстер-класи?',
        answer: 'Ні. Оплата єдиноразова, доступ назавжди, нові МК відкриваються автоматично.',
      },
    ],
    cover: 'course-bead-cover.jpg',
    gallery: ['course-bead-1.jpg', 'course-bead-2.jpg'],
    alt: 'Прикраса з бісеру ручної роботи',
  },
  {
    slug: 'mk-chervona-kryza',
    title: 'МК «Червона криза з тороками»',
    tagline: 'Майстер-клас живої традиції українського плетіння',
    direction: 'biseropletinnia',
    price: 400,
    featured: false,
    description: [
      {
        type: 'p',
        text: 'Цей майстер-клас створений для тих, хто цінує українську культуру, стиль та естетику ручної роботи. Червона криза — це не просто прикраса, це символ пристрасті, краси та глибоких культурних коренів.',
      },
      {
        type: 'p',
        text: 'Навчання побудоване так, щоб кожна учасниця змогла сплести унікальний виріб власними руками — навіть без попереднього досвіду.',
      },
      { type: 'h2', text: 'Що входить' },
      {
        type: 'p',
        text: 'Повне відео-навчання з детальними інструкціями. Схеми плетіння червоної кризи з тороками. Пояснення технік та секретів майстринь. Підтримка та відповіді на питання під час навчання.',
      },
    ],
    lessons: [
      {
        title: 'Червона криза з тороками',
        description: 'Відео-навчання, схеми плетіння та пояснення технік.',
      },
    ],
    cover: 'course-red-kryza-cover.jpg',
    alt: 'Червона криза з тороками — прикраса з бісеру',
  },
  {
    slug: 'mk-prozora-kryza',
    title: 'МК «Прозора криза»',
    tagline: 'Наш бестселер. З бонусним уроком про прозорий чокер',
    direction: 'biseropletinnia',
    price: 400,
    featured: false,
    description: [
      {
        type: 'p',
        text: 'Ми — майстерня «Стан_юа_маркет». У нашій команді 10 майстринь, ми створили тисячі прикрас, і наші прикраси носять в Україні та закордоном.',
      },
      {
        type: 'p',
        text: 'Прозора криза стала нашим бестселером, і ми хочемо, щоб якомога більше жінок носили цей шедевр. Тож створили майстер-клас, завдяки якому кожна зможе сплести цю королівську прикрасу — навіть без досвіду.',
      },
      { type: 'h2', text: 'Програма майстер-класу' },
      {
        type: 'p',
        text: 'Відео-уроки. Схеми прозорої кризи та прозорого чокеру. Підбір кольорів за номерами бісеру — у дешевшому чеському та дорожчому японському варіантах з потрібними грамовками. Посилання на магазини бісеру. Опис інструментів: голки, нитки.',
      },
      { type: 'h2', text: 'Бонус' },
      {
        type: 'p',
        text: 'При оплаті майстер-класу ви отримаєте урок-подарунок «Плетемо прозорий чокер». Чокер ідеально пасує до кризи.',
      },
    ],
    lessons: [
      { title: 'Плетемо прозору кризу', description: 'Відео-уроки, схеми та підбір кольорів.' },
      { title: 'Бонус: плетемо прозорий чокер', description: 'Урок-подарунок при оплаті МК.' },
    ],
    faq: [
      {
        question: 'Чи підійде мені МК, якщо я ніколи не мала справи з бісером?',
        answer:
          'Так, ми зробили все можливе, щоб матеріал був зрозумілим для новачків. Наші учениці вже сплели свої кризи «з нуля».',
      },
      {
        question: 'Чи зможу я отримати консультацію, якщо щось буде незрозумілим?',
        answer:
          'Так, разом з МК ви отримаєте посилання на нашу сторінку в Інстаграм. Ми завжди на звʼязку, і ви зможете написати нам у приватні.',
      },
      {
        question: 'Чим відрізняється чеський дешевший бісер від дорожчого японського?',
        answer:
          'Якістю та красою відтінків і текстур. У чеському бісері є відсіювання під час плетіння — деякі бісерини можуть бути з браком, у японському це велика рідкість. Ми плетемо наші оригінальні кризи з японського бісеру, але замінники в чеському варіанті теж створюють красиву картину у виробі.',
      },
      {
        question: 'Скільки займає плетіння?',
        answer:
          'Це індивідуально. Навіть наші професійні майстри плетуть у різному темпі — хтось за 5, а хтось за 12 днів. Практика показала, що деякі учениці «з нуля» плетуть теж дуже швидко, до 7 днів, а деякі не поспішаючи, до двох тижнів.',
      },
      {
        question: 'Чим особливий процес плетіння?',
        answer:
          'Він заворожує, ніби медитація. Хочеться сплести ще ряд, а за ним іще. Тож будьте готові до того, що плетіння вас поглине на деякий час.',
      },
    ],
    cover: 'course-clear-kryza-cover.jpg',
    alt: 'Прозора криза — прикраса з бісеру',
  },
]

for (const course of COURSES) {
  const cover = await upload(course.cover, course.alt)
  const gallery = (
    await Promise.all((course.gallery ?? []).map((file) => upload(file, course.alt)))
  ).filter((id): id is number => typeof id === 'number')

  const data = {
    title: course.title,
    slug: course.slug,
    tagline: course.tagline,
    price: course.price,
    oldPrice: course.oldPrice,
    level: 'beginner' as const,
    direction: directionIds[course.direction],
    // Чернетка, поки немає ID каналу — див. коментар на початку файлу.
    status: 'draft' as const,
    featured: course.featured,
    accessType: 'telegram' as const,
    description: richText(course.description),
    lessons: course.lessons,
    faq: course.faq ?? [],
    ...(cover ? { cover } : {}),
    ...(gallery.length ? { gallery } : {}),
  }

  const found = await payload.find({
    collection: 'courses',
    where: { slug: { equals: course.slug } },
    limit: 1,
  })

  if (found.docs[0]) {
    await payload.update({ collection: 'courses', id: found.docs[0].id, data })
    payload.logger.info(`Оновлено: ${course.title}`)
  } else {
    await payload.create({ collection: 'courses', data })
    payload.logger.info(`Створено: ${course.title}`)
  }
}

// --- Прибирання демонстраційних даних ------------------------------------
// Вигадані курси з seed/index.ts і фото до них. Замовлення не постраждають:
// orders_items зберігає власну копію назви й ціни, а звʼязок гаситься в null.
const DEMO_SLUGS = [
  'viazani-sumky',
  'topy-hachkom',
  'braslety-biser',
  'kolie-chokery',
  'makrame-baza',
  'panno-kashpo',
  'zhakardovi-svetry',
  'broshi-biser',
  'velyki-panno',
  'test-makrame-panno',
]

const demo = await payload.find({
  collection: 'courses',
  where: { slug: { in: DEMO_SLUGS } },
  limit: 100,
})

if (demo.docs.length) {
  // Відгуки до них інакше лишились би висіти з порожнім курсом: звʼязок
  // гаситься в null, а сам відгук — ні.
  const reviews = await payload.find({
    collection: 'reviews',
    where: { course: { in: demo.docs.map((doc) => doc.id) } },
    limit: 200,
  })
  for (const review of reviews.docs) {
    await payload.delete({ collection: 'reviews', id: review.id })
  }
  payload.logger.info(`Видалено відгуків: ${reviews.docs.length}`)

  for (const doc of demo.docs) {
    await payload.delete({ collection: 'courses', id: doc.id })
  }
  payload.logger.info(`Видалено демо-курсів: ${demo.docs.length}`)
}

// Фото демо-курсів. Крім них у медіатеці нічого не чіпаємо: product-*.jpg
// стоять на товарах, journal-*, page-*, dir-* — на журналі, сторінках і
// напрямах, і всі вони лишаються.
const DEMO_PHOTOS = [
  ...Array.from({ length: 6 }, (_, i) => `course-${i + 1}.jpg`),
  ...Array.from({ length: 6 }, (_, i) => `product2-${i + 1}.jpg`),
]

const photos = await payload.find({
  collection: 'media',
  where: { filename: { in: DEMO_PHOTOS } },
  limit: 100,
})

for (const photo of photos.docs) {
  await payload.delete({ collection: 'media', id: photo.id })
}
payload.logger.info(`Видалено демо-фото: ${photos.docs.length}`)

const left = await payload.count({ collection: 'courses' })
payload.logger.info(`Курсів у базі: ${left.totalDocs}`)
payload.logger.info('Готово.')

process.exit(0)
