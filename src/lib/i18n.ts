export const LOCALES = ['uk', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'uk'

export const isLocale = (value: unknown): value is Locale =>
  typeof value === 'string' && (LOCALES as readonly string[]).includes(value)

/**
 * Українська живе в корені (/shop), англійська — з префіксом (/en/shop).
 * Основний ринок не має платити зайвим редіректом і розмитим SEO за мову,
 * яку додають «на майбутнє».
 */
export const localePath = (locale: Locale, path: string): string => {
  const clean = path.startsWith('/') ? path : `/${path}`
  if (locale === DEFAULT_LOCALE) return clean
  return clean === '/' ? '/en' : `/en${clean}`
}

type Dictionary = {
  nav: { courses: string; shop: string; about: string; allCourses: string; allProducts: string }
  header: { menu: string; closeMenu: string; search: string; account: string; cart: string; home: string }
  cart: {
    title: string
    empty: string
    chooseCourse: string
    total: string
    deliveryNote: string
    checkout: string
    forever: string
    remove: string
    less: string
    more: string
  }
  footer: {
    tagline: string
    subscribe: string
    subscribeCta: string
    subscribed: string
    offer: string
    columns: { courses: string; shop: string; brand: string }
    links: {
      allDirections: string
      myAccess: string
      howAccess: string
      allProducts: string
      kits: string
      delivery: string
      about: string
      reviews: string
      journal: string
    }
  }
  common: { language: string; loading: string; back: string }
  home: {
    eyebrow: string
    heroTitle: string
    heroSubtitle: string
    ctaCourses: string
    ctaShop: string
    directionsLabel: string
    directionsTitle: string
    stepsLabel: string
    stepsTitle: string
    steps: { title: string; text: string }[]
    shopLabel: string
    shopTitle: string
    reviewsLabel: string
    coursesCount: (count: number) => string
    soon: string
  }
  shop: {
    label: string
    title: string
    category: string
    all: string
    color: string
    price: string
    inStockOnly: string
    sort: string
    sortNew: string
    sortCheap: string
    sortExpensive: string
    found: (count: number) => string
    empty: string
    reset: string
    priceRanges: string[]
  }
  product: {
    color: string
    size: string
    inStock: string
    lastLeft: (count: number) => string
    outOfStock: string
    addToCart: string
    delivery: string
    deliveryValue: string
    payment: string
    paymentValue: string
    madeBy: string
    madeByValue: string
    related: string
    addonsTitle: string
    addonsNote: string
    addonsEmpty: string
    addonsAdd: (count: number, sum: string) => string
  }
  courses: {
    label: string
    title: string
    intro: string
    programme: string
    afterPayment: string
    whatYouGet: string
    faq: string
    buy: string
    saved: string
    save: string
    forever: string
    levels: Record<string, string>
    perks: string[]
  }
  checkout: {
    label: string
    title: string
    contacts: string
    name: string
    phone: string
    email: string
    emailNote: string
    delivery: string
    city: string
    branch: string
    address: string
    deliveryNote: string
    payment: string
    card: string
    cod: string
    codNote: string
    comment: string
    commentPlaceholder: string
    order: string
    promo: string
    promoPlaceholder: string
    toPay: string
    submit: string
    submitting: string
    terms: string
    termsLink: string
    empty: string
  }
  account: {
    label: string
    guestTitle: string
    title: string
    access: string
    accessEmpty: string
    accessForever: string
    openMaterials: string
    preparing: string
    personalNote: string
    resend: string
    resending: string
    savedCourses: string
    logout: string
  }
  reviews: {
    label: string
    average: (value: number) => string
    leave: string
    sent: string
    namePlaceholder: string
    rating: string
    textPlaceholder: string
    submit: string
    cancel: string
    empty: string
  }
  journal: { label: string; title: string; empty: string; fromArticle: string; learn: string }
  search: { label: string; placeholder: string; submit: string; found: (n: number) => string; nothing: string }
  thanks: { paidTitle: string; acceptedTitle: string; pending: string; courseNote: string; shipNote: string; waiting: string; toShop: string; myAccess: string }
}

const uk: Dictionary = {
  nav: {
    courses: 'Курси',
    shop: 'Магазин',
    about: 'Про бренд',
    allCourses: 'Усі курси',
    allProducts: 'Усі товари',
  },
  header: {
    menu: 'Відкрити меню',
    closeMenu: 'Закрити меню',
    search: 'Пошук',
    account: 'Кабінет',
    cart: 'Кошик',
    home: 'МК — головна',
  },
  cart: {
    title: 'Кошик',
    empty: 'Тут поки порожньо.',
    chooseCourse: 'Обрати курс',
    total: 'Разом',
    deliveryNote: 'Вартість доставки рахується на наступному кроці.',
    checkout: 'Оформити',
    forever: 'Доступ назавжди',
    remove: 'Прибрати',
    less: 'Менше',
    more: 'Більше',
  },
  footer: {
    tagline: 'Прикраси ручної роботи та майстер-класи з вʼязання, бісероплетіння й макраме.',
    subscribe: 'Новинки й знижки на пошту',
    subscribeCta: 'Підписатись',
    subscribed: 'Готово. Тепер новинки приходитимуть вам першою.',
    offer: 'Публічна оферта',
    columns: { courses: 'Курси', shop: 'Магазин', brand: 'Бренд' },
    links: {
      allDirections: 'Усі напрями',
      myAccess: 'Мої доступи',
      howAccess: 'Як я отримаю доступ',
      allProducts: 'Усі товари',
      kits: 'Набори',
      delivery: 'Доставка й оплата',
      about: 'Про нас',
      reviews: 'Відгуки',
      journal: 'Журнал',
    },
  },
  common: { language: 'Мова', loading: 'Хвилинку…', back: 'Назад' },
  home: {
    eyebrow: 'ХЕНДМЕЙД-СТУДІЯ · УКРАЇНА',
    heroTitle: 'Прикраси ручної роботи. І курси, щоб зробити свою.',
    heroSubtitle: 'Вʼязання, бісероплетіння й макраме — від першої петлі до готової прикраси.',
    ctaCourses: 'Обрати курс',
    ctaShop: 'Дивитись прикраси',
    directionsLabel: 'Три напрями',
    directionsTitle: 'З чого почати',
    stepsLabel: 'Після оплати',
    stepsTitle: 'Доступ приходить сам. Пересилати нічого не треба.',
    steps: [
      {
        title: 'Обираєте курс і платите карткою',
        text: 'Просто на сайті, без листування й пересилання реквізитів. Apple Pay і Google Pay теж працюють.',
      },
      {
        title: 'Одразу отримуєте доступ',
        text: 'Запрошення в закритий Telegram-канал приходить автоматично — за хвилину після оплати, без нашої участі.',
      },
      {
        title: 'Дивитесь, коли зручно',
        text: 'Відео, схеми й рекомендації лишаються з вами назавжди. Термін доступу не спливає.',
      },
    ],
    shopLabel: 'Магазин',
    shopTitle: 'Готові прикраси',
    reviewsLabel: 'Відгуки',
    coursesCount: (count: number) => `${count} ${count === 1 ? 'курс' : count < 5 ? 'курси' : 'курсів'}`,
    soon: 'Скоро',
  },
  shop: {
    label: 'Магазин',
    title: 'Усе ручної роботи',
    category: 'Категорія',
    all: 'Усі',
    color: 'Колір',
    price: 'Ціна',
    inStockOnly: 'Лише в наявності',
    sort: 'Сортування',
    sortNew: 'Спочатку нові',
    sortCheap: 'Дешевші спершу',
    sortExpensive: 'Дорожчі спершу',
    found: (count: number) => `${count} позицій`,
    empty: 'За цими умовами нічого немає.',
    reset: 'Скинути фільтри',
    priceRanges: ['до 500 ₴', '500–1000 ₴', 'від 1000 ₴'],
  },
  product: {
    color: 'Колір',
    size: 'Розмір',
    inStock: 'В наявності',
    lastLeft: (count: number) => `Лишилось ${count} шт — ручна робота, партії маленькі`,
    outOfStock: 'Немає в наявності. Напишіть нам — зробимо під замовлення.',
    addToCart: 'Додати в кошик',
    delivery: 'Доставка',
    deliveryValue: 'Нова Пошта, Укрпошта',
    payment: 'Оплата',
    paymentValue: 'Картка, Apple Pay, Google Pay',
    madeBy: 'Виготовлення',
    madeByValue: 'Ручна робота',
    related: 'Схоже',
    addonsTitle: 'Докупити до набору',
    addonsNote: 'Дрібниці, яких зазвичай не вистачає.',
    addonsEmpty: 'Оберіть, що додати',
    addonsAdd: (count: number, sum: string) => `Додати ${count} · ${sum}`,
  },
  courses: {
    label: 'Курси',
    title: 'Навчимо робити руками. Далі — самі.',
    intro:
      'Кожен курс — це набір майстер-класів: відео, схеми й рекомендації з матеріалів. Після оплати доступ приходить автоматично й лишається назавжди.',
    programme: 'Програма',
    afterPayment: 'Після оплати',
    whatYouGet: 'Що ви отримаєте',
    faq: 'Часті питання',
    buy: 'Купити курс',
    saved: 'Збережено',
    save: 'Зберегти на потім',
    forever: 'Доступ назавжди',
    levels: { beginner: 'Для початківців', medium: 'Середній рівень', advanced: 'Просунутий рівень' },
    perks: [
      'Доступ приходить одразу після оплати',
      'Лишається назавжди, без обмеження за часом',
      'Оплата карткою, Apple Pay або Google Pay',
    ],
  },
  checkout: {
    label: 'Оформлення',
    title: 'Ще один крок',
    contacts: 'Контакти',
    name: 'Імʼя та прізвище',
    phone: '+380',
    email: 'Пошта — на неї прийде доступ',
    emailNote: 'Доступ до курсу приходить на пошту одразу після оплати. Перевірте адресу.',
    delivery: 'Доставка',
    city: 'Місто',
    branch: 'Відділення або поштомат',
    address: 'Вулиця, будинок, квартира',
    deliveryNote: 'Доставка за тарифами перевізника.',
    payment: 'Оплата',
    card: 'Карткою онлайн · Apple Pay · Google Pay',
    cod: 'Накладений платіж із передплатою',
    codNote: 'Зараз сплачуєте передплату, решту — при отриманні на пошті.',
    comment: 'Коментар',
    commentPlaceholder: 'Побажання до замовлення',
    order: 'Замовлення',
    promo: 'Промокод',
    promoPlaceholder: 'Якщо є',
    toPay: 'До сплати',
    submit: 'Перейти до оплати',
    submitting: 'Готуємо оплату…',
    terms: 'Натискаючи кнопку, ви приймаєте умови',
    termsLink: 'публічної оферти',
    empty: 'Кошик порожній.',
  },
  account: {
    label: 'Кабінет',
    guestTitle: 'Ваші курси й обране',
    title: 'Кабінет',
    access: 'Мої доступи',
    accessEmpty: 'Тут зʼявляться курси, які ви купите.',
    accessForever: 'Доступ безтерміновий',
    openMaterials: 'Відкрити матеріали',
    preparing: 'Посилання готується',
    personalNote: 'Посилання персональні — не пересилайте їх іншим.',
    resend: 'Видати посилання ще раз',
    resending: 'Випускаємо…',
    savedCourses: 'Збережені курси',
    logout: 'Вийти',
  },
  reviews: {
    label: 'Відгуки',
    average: (value: number) => `${value} з 5`,
    leave: 'Залишити відгук',
    sent: 'Дякуємо! Відгук зʼявиться на сайті після перевірки.',
    namePlaceholder: 'Як вас звати',
    rating: 'Оцінка',
    textPlaceholder: 'Що сподобалось, що ні',
    submit: 'Надіслати',
    cancel: 'Скасувати',
    empty: 'Відгуків поки немає. Будете першою.',
  },
  journal: {
    label: 'Журнал',
    title: 'Гайди, поради, за лаштунками',
    empty: 'Перші статті вже пишуться.',
    fromArticle: 'Зі статті',
    learn: 'Навчитись',
  },
  search: {
    label: 'Пошук',
    placeholder: 'Що шукаємо?',
    submit: 'Знайти',
    found: (n: number) => `Знайшли ${n}`,
    nothing: 'Нічого не знайшли',
  },
  thanks: {
    paidTitle: 'Дякуємо! Замовлення оплачено',
    acceptedTitle: 'Замовлення прийнято',
    pending: 'Ми звʼяжемось із вами найближчим часом і надішлемо реквізити для оплати.',
    courseNote: 'Доступ до курсу вже надіслано на вашу пошту. Якщо листа немає — перевірте «Спам».',
    shipNote: 'Ми пакуємо замовлення й надішлемо ТТН, щойно передамо його перевізнику.',
    waiting: 'Щойно банк підтвердить оплату, ми надішлемо лист. Зазвичай це займає до хвилини.',
    toShop: 'Далі до магазину',
    myAccess: 'Мої доступи',
  },
}

const en: Dictionary = {
  nav: {
    courses: 'Courses',
    shop: 'Shop',
    about: 'About',
    allCourses: 'All courses',
    allProducts: 'All products',
  },
  header: {
    menu: 'Open menu',
    closeMenu: 'Close menu',
    search: 'Search',
    account: 'Account',
    cart: 'Cart',
    home: 'MK — home',
  },
  cart: {
    title: 'Cart',
    empty: 'Nothing here yet.',
    chooseCourse: 'Browse courses',
    total: 'Total',
    deliveryNote: 'Shipping is calculated at the next step.',
    checkout: 'Checkout',
    forever: 'Lifetime access',
    remove: 'Remove',
    less: 'Less',
    more: 'More',
  },
  footer: {
    tagline: 'Handmade jewellery and master classes in knitting, beadwork and macramé.',
    subscribe: 'New arrivals and offers by email',
    subscribeCta: 'Subscribe',
    subscribed: 'Done. You will hear about new pieces first.',
    offer: 'Terms of sale',
    columns: { courses: 'Courses', shop: 'Shop', brand: 'Brand' },
    links: {
      allDirections: 'All directions',
      myAccess: 'My access',
      howAccess: 'How access works',
      allProducts: 'All products',
      kits: 'Kits',
      delivery: 'Shipping and payment',
      about: 'About us',
      reviews: 'Reviews',
      journal: 'Journal',
    },
  },
  common: { language: 'Language', loading: 'One moment…', back: 'Back' },
  home: {
    eyebrow: 'HANDMADE STUDIO · UKRAINE',
    heroTitle: 'Handmade jewellery. And the courses to make your own.',
    heroSubtitle: 'Knitting, beadwork and macrame — from the first stitch to a finished piece.',
    ctaCourses: 'Browse courses',
    ctaShop: 'Shop jewellery',
    directionsLabel: 'Three crafts',
    directionsTitle: 'Where to start',
    stepsLabel: 'After payment',
    stepsTitle: 'Access arrives on its own. Nothing to forward.',
    steps: [
      {
        title: 'Pick a course and pay by card',
        text: 'Right on the site, with no messaging back and forth. Apple Pay and Google Pay work too.',
      },
      {
        title: 'Get access immediately',
        text: 'An invite to the private Telegram channel arrives automatically, about a minute after payment.',
      },
      {
        title: 'Watch whenever suits you',
        text: 'Videos, patterns and material notes stay with you for good. Access never expires.',
      },
    ],
    shopLabel: 'Shop',
    shopTitle: 'Ready to wear',
    reviewsLabel: 'Reviews',
    coursesCount: (count: number) => `${count} ${count === 1 ? 'course' : 'courses'}`,
    soon: 'Coming soon',
  },
  shop: {
    label: 'Shop',
    title: 'Everything handmade',
    category: 'Category',
    all: 'All',
    color: 'Colour',
    price: 'Price',
    inStockOnly: 'In stock only',
    sort: 'Sort',
    sortNew: 'Newest first',
    sortCheap: 'Price: low to high',
    sortExpensive: 'Price: high to low',
    found: (count: number) => `${count} items`,
    empty: 'Nothing matches these filters.',
    reset: 'Clear filters',
    priceRanges: ['under 500 UAH', '500-1000 UAH', 'over 1000 UAH'],
  },
  product: {
    color: 'Colour',
    size: 'Size',
    inStock: 'In stock',
    lastLeft: (count: number) => `Only ${count} left - handmade in small batches`,
    outOfStock: 'Out of stock. Write to us and we will make it to order.',
    addToCart: 'Add to cart',
    delivery: 'Shipping',
    deliveryValue: 'Nova Poshta, Ukrposhta',
    payment: 'Payment',
    paymentValue: 'Card, Apple Pay, Google Pay',
    madeBy: 'Made',
    madeByValue: 'By hand',
    related: 'You may also like',
    addonsTitle: 'Add to your kit',
    addonsNote: 'The small things people usually run out of.',
    addonsEmpty: 'Choose what to add',
    addonsAdd: (count: number, sum: string) => `Add ${count} · ${sum}`,
  },
  courses: {
    label: 'Courses',
    title: 'We teach the craft. The rest is yours.',
    intro:
      'Every course is a set of master classes: video, patterns and material notes. Access arrives automatically after payment and stays for good.',
    programme: 'Programme',
    afterPayment: 'After payment',
    whatYouGet: 'What you get',
    faq: 'Common questions',
    buy: 'Buy the course',
    saved: 'Saved',
    save: 'Save for later',
    forever: 'Lifetime access',
    levels: { beginner: 'Beginner', medium: 'Intermediate', advanced: 'Advanced' },
    perks: [
      'Access arrives right after payment',
      'Stays yours for good, with no time limit',
      'Pay by card, Apple Pay or Google Pay',
    ],
  },
  checkout: {
    label: 'Checkout',
    title: 'One more step',
    contacts: 'Contact details',
    name: 'Full name',
    phone: '+380',
    email: 'Email - access will be sent here',
    emailNote: 'Course access arrives by email right after payment. Please check the address.',
    delivery: 'Shipping',
    city: 'City',
    branch: 'Branch or parcel locker',
    address: 'Street, building, apartment',
    deliveryNote: 'Shipping is charged at the carrier rate.',
    payment: 'Payment',
    card: 'Card online · Apple Pay · Google Pay',
    cod: 'Cash on delivery with a deposit',
    codNote: 'You pay the deposit now and the rest on collection.',
    comment: 'Note',
    commentPlaceholder: 'Anything we should know',
    order: 'Your order',
    promo: 'Promo code',
    promoPlaceholder: 'If you have one',
    toPay: 'Total',
    submit: 'Go to payment',
    submitting: 'Preparing payment…',
    terms: 'By continuing you accept the',
    termsLink: 'terms of sale',
    empty: 'Your cart is empty.',
  },
  account: {
    label: 'Account',
    guestTitle: 'Your courses and saved items',
    title: 'Account',
    access: 'My access',
    accessEmpty: 'Courses you buy will appear here.',
    accessForever: 'Access never expires',
    openMaterials: 'Open materials',
    preparing: 'Link is being prepared',
    personalNote: 'These links are personal - please do not forward them.',
    resend: 'Issue the link again',
    resending: 'Issuing…',
    savedCourses: 'Saved courses',
    logout: 'Sign out',
  },
  reviews: {
    label: 'Reviews',
    average: (value: number) => `${value} out of 5`,
    leave: 'Write a review',
    sent: 'Thank you! Your review appears once we have checked it.',
    namePlaceholder: 'Your name',
    rating: 'Rating',
    textPlaceholder: 'What you liked, what you did not',
    submit: 'Send',
    cancel: 'Cancel',
    empty: 'No reviews yet. Be the first.',
  },
  journal: {
    label: 'Journal',
    title: 'Guides, tips, behind the scenes',
    empty: 'The first articles are being written.',
    fromArticle: 'From this article',
    learn: 'Learn the craft',
  },
  search: {
    label: 'Search',
    placeholder: 'What are you looking for?',
    submit: 'Search',
    found: (n: number) => `${n} results`,
    nothing: 'Nothing found',
  },
  thanks: {
    paidTitle: 'Thank you! Your order is paid',
    acceptedTitle: 'Order received',
    pending: 'We will get in touch shortly and send the payment details.',
    courseNote: 'Course access has been emailed to you. If it is not there, check your spam folder.',
    shipNote: 'We are packing your order and will send the tracking number once it ships.',
    waiting: 'As soon as the bank confirms the payment we will email you. It usually takes under a minute.',
    toShop: 'Back to the shop',
    myAccess: 'My access',
  },
}

const DICTIONARIES: Record<Locale, Dictionary> = { uk, en }

export const dictionary = (locale: Locale): Dictionary => DICTIONARIES[locale] ?? DICTIONARIES.uk
