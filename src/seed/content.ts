import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * Наповнення текстових розділів: сторінки, журнал, звʼязки наборів.
 * Запуск: npm run seed:content
 */
const payload = await getPayload({ config })

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

const PAGES = [
  {
    slug: 'about',
    title: 'Про бренд',
    intro:
      'Ми робимо прикраси руками — і вчимо робити їх вас. Усе, що бачите на сайті, зроблено в невеликій майстерні, без конвеєра.',
    content: [
      { type: 'h2' as const, text: 'Як усе почалось' },
      {
        type: 'p' as const,
        text: 'Спершу було вʼязання для себе, потім замовлення від подруг, далі Instagram. Сьогодні це три напрями — вʼязання, бісероплетіння й макраме — і сотні людей, які навчились робити прикраси самостійно.',
      },
      { type: 'h2' as const, text: 'Чому кожна річ трохи інакша' },
      {
        type: 'p' as const,
        text: 'Ручна робота не буває однаковою. Відтінок нитки з різних партій відрізняється, вузол лягає щоразу по-своєму. Це не дефект, а ознака того, що річ робила людина, а не машина.',
      },
      { type: 'h2' as const, text: 'Курси' },
      {
        type: 'p' as const,
        text: 'Кожен курс — це набір майстер-класів із відео, схемами й переліком матеріалів. Доступ приходить одразу після оплати й лишається назавжди: повертайтесь до матеріалів коли завгодно.',
      },
    ],
  },
  {
    slug: 'delivery',
    title: 'Доставка й оплата',
    intro: 'Відправляємо по всій Україні. Курси приходять миттєво, товари — за 1–3 дні.',
    content: [
      { type: 'h2' as const, text: 'Курси' },
      {
        type: 'p' as const,
        text: 'Після оплати ви автоматично отримуєте персональне запрошення в закритий Telegram-канал курсу або посилання на матеріали. Лист приходить на пошту протягом хвилини. Доступ безтерміновий, повернутись до матеріалів можна будь-коли з кабінету.',
      },
      { type: 'h2' as const, text: 'Товари' },
      {
        type: 'p' as const,
        text: 'Нова Пошта — відділення, поштомат або курʼєр до дверей. Укрпошта — якщо у вашому населеному пункті немає Нової Пошти. Вартість доставки за тарифами перевізника, оплачується при отриманні.',
      },
      { type: 'h2' as const, text: 'Оплата' },
      {
        type: 'p' as const,
        text: 'Карткою онлайн — Visa, Mastercard, Apple Pay і Google Pay. Для фізичних товарів доступний накладений платіж: онлайн сплачується невелика передплата, решта — при отриманні на пошті.',
      },
      { type: 'h2' as const, text: 'Повернення' },
      {
        type: 'p' as const,
        text: 'Товар належної якості можна повернути протягом 14 днів, якщо він не був у використанні та збережено товарний вигляд. Курси, як цифровий товар із миттєвим доступом, поверненню не підлягають — тому ми детально описуємо програму до покупки.',
      },
    ],
  },
  {
    slug: 'offer',
    title: 'Публічна оферта',
    intro:
      'Договір публічної оферти про продаж товарів і надання доступу до інформаційних матеріалів.',
    content: [
      { type: 'h2' as const, text: '1. Загальні положення' },
      {
        type: 'p' as const,
        text: 'Цей документ є офіційною пропозицією укласти договір купівлі-продажу товарів та надання доступу до інформаційних матеріалів. Оформлюючи замовлення, покупець підтверджує, що ознайомився з умовами й погоджується з ними.',
      },
      { type: 'h2' as const, text: '2. Предмет договору' },
      {
        type: 'p' as const,
        text: 'Продавець зобовʼязується передати покупцю товар або надати доступ до інформаційних матеріалів, а покупець — прийняти й оплатити їх на умовах цього договору.',
      },
      { type: 'h2' as const, text: '3. Ціна й оплата' },
      {
        type: 'p' as const,
        text: 'Ціни вказані в гривнях. Оплата здійснюється через платіжний сервіс WayForPay. Фіскальний чек надсилається на електронну пошту покупця.',
      },
      { type: 'h2' as const, text: '4. Доступ до матеріалів' },
      {
        type: 'p' as const,
        text: 'Доступ надається персонально й безтерміново. Передавати посилання третім особам, копіювати чи поширювати матеріали заборонено.',
      },
      { type: 'h2' as const, text: '5. Реквізити' },
      {
        type: 'p' as const,
        text: 'ФОП, друга група оподаткування. Повні реквізити надаються на запит: вкажіть їх у коментарі до замовлення або напишіть нам.',
      },
    ],
  },
]

for (const page of PAGES) {
  const found = await payload.find({ collection: 'pages', where: { slug: { equals: page.slug } }, limit: 1 })
  const data = {
    title: page.title,
    slug: page.slug,
    intro: page.intro,
    content: richText(page.content),
    status: 'published' as const,
  }

  if (found.docs[0]) {
    await payload.update({ collection: 'pages', id: found.docs[0].id, data })
  } else {
    await payload.create({ collection: 'pages', data })
  }
}
payload.logger.info(`Сторінки: ${PAGES.length}`)

const POSTS = [
  {
    slug: 'z-choho-pochaty-viazannia',
    title: 'З чого почати вʼязання: чесний список без зайвого',
    excerpt:
      'Гачок, пряжа, ножиці — і все. Розбираємо, що справді потрібно новачку, а на чому продавці заробляють.',
    tags: ['вʼязання', 'для початківців'],
    content: [
      { type: 'p' as const, text: 'Найчастіше питання перед першим МК: що купити, щоб не витратити зайвого.' },
      { type: 'h2' as const, text: 'Гачок' },
      {
        type: 'p' as const,
        text: 'Для трикотажної пряжі беріть номер 7–9. Металевий із силіконовою ручкою — рука втомлюється менше, ніж із суцільно металевим.',
      },
      { type: 'h2' as const, text: 'Пряжа' },
      {
        type: 'p' as const,
        text: 'Перший моток беріть світлий: на темному складно розгледіти петлі, і ви витратите вдвічі більше часу на кожен ряд.',
      },
    ],
  },
  {
    slug: 'yak-doglyadaty-za-prykrasamy',
    title: 'Як доглядати за прикрасами ручної роботи',
    excerpt: 'Щоб бісер не потьмянів, а шнур не розлохматився: п’ять правил, які працюють.',
    tags: ['догляд'],
    content: [
      {
        type: 'p' as const,
        text: 'Прикраси ручної роботи живуть довго, якщо не робити з ними трьох речей: не мочити, не тримати на сонці й не кидати в спільну шкатулку.',
      },
      { type: 'h2' as const, text: 'Зберігання' },
      {
        type: 'p' as const,
        text: 'Окремий мішечок для кожної прикраси. Це найдешевше, що можна зробити, і воно рятує від подряпин і сплутаних шнурів.',
      },
    ],
  },
  {
    slug: 'podarunok-svoimy-rukamy',
    title: 'Подарунок, який не соромно вручити',
    excerpt: 'Набір для створення прикраси як подарунок: кому підходить і що покласти всередину.',
    tags: ['подарунки', 'набори'],
    content: [
      {
        type: 'p' as const,
        text: 'Набір для створення — це подарунок і враження одночасно: людина отримує не готову річ, а вечір за приємним заняттям.',
      },
    ],
  },
]

for (const post of POSTS) {
  const found = await payload.find({ collection: 'posts', where: { slug: { equals: post.slug } }, limit: 1 })
  if (found.docs[0]) continue

  await payload.create({
    collection: 'posts',
    data: {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      tags: post.tags,
      content: richText(post.content),
      publishedAt: new Date().toISOString(),
      status: 'published',
    },
  })
}
payload.logger.info(`Статті: ${POSTS.length}`)

// Дрібниці, які можна докупити до набору.
const kits = await payload.find({ collection: 'products', where: { isKit: { equals: true } }, limit: 10 })
const addons = await payload.find({
  collection: 'products',
  where: { isKit: { equals: false }, price: { less_than: 500 } },
  limit: 3,
})

for (const kit of kits.docs) {
  if ((kit.addons ?? []).length > 0) continue
  await payload.update({
    collection: 'products',
    id: kit.id,
    data: { addons: addons.docs.map((doc) => doc.id) },
  })
}
payload.logger.info(`Набори з апселом: ${kits.docs.length}`)

payload.logger.info('Готово.')
process.exit(0)
