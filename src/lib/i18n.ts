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
  common: { language: string }
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
  common: { language: 'Мова' },
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
  common: { language: 'Language' },
}

const DICTIONARIES: Record<Locale, Dictionary> = { uk, en }

export const dictionary = (locale: Locale): Dictionary => DICTIONARIES[locale] ?? DICTIONARIES.uk
