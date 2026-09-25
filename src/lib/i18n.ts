import type { DeliveryMethod, PaymentMethod } from '@/lib/delivery'
import { plural } from '@/lib/format'

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
  nav: {
    home: string
    journal: string
    courses: string
    shop: string
    about: string
    allCourses: string
    allProducts: string
    /** Назви розділів у мобільному меню (302:4484) — довші за `courses`/`shop`. */
    learn: string
    finished: string
  }
  header: { menu: string; closeMenu: string; search: string; account: string; cart: string; home: string }
  cart: {
    title: string
    empty: string
    chooseCourse: string
    /** Те саме, але для магазину: кнопка в порожньому кошику залежить від розділу. */
    chooseProduct: string
    total: string
    deliveryNote: string
    checkout: string
    forever: string
    remove: string
    less: string
    more: string
    close: string
    /** «До безкоштовної доставки — ще 440 ₴»; {sum} — скільки лишилось добрати. */
    freeDeliveryLeft: string
    freeDeliveryReached: string
    summary: string
    items: string
    delivery: string
    deliveryAtCheckout: string
    toPay: string
    inStock: string
    instantAccess: string
    telegramForever: string
    colorLabel: string
    sizeLabel: string
    mayLike: string
    add: string
    placeOrder: string
  }
  footer: {
    tagline: string
    subscribe: string
    subscribeCta: string
    subscribed: string
    offer: string
    privacy: string
    columns: { courses: string; shop: string; brand: string }
    links: {
      allDirections: string
      myAccess: string
      savedCourses: string
      faq: string
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
    filters: string
    allFilters: string
    availability: string
    showCount: (count: number) => string
  }
  shopLanding: {
    hero: {
      label: string
      title: string
      body: string
      cta: string
      imageAlt: string
    }
    categories: {
      label: string
      title: string
      /** «4 товари · від 350 ₴». Рахується з бази — див. lib/volumes.ts. */
      volume: (count: number, from: string) => string
      /** Коли за карткою поки нічого немає. */
      soon: string
      items: { title: string; subtitle: string; href: string; imageAlt: string }[]
    }
    delivery: {
      label: string
      title: string
      steps: { number: string; title: string; body: string }[]
    }
    journal: {
      label: string
      title: string
      /* Картки беруться з колекції «Журнал» — див. shop/page.tsx. */
    }
  }
  coursesLanding: {
    hero: {
      label: string
      title: string
      body: string
      cta: string
      imageAlt: string
    }
    directions: {
      label: string
      title: string
      /** «2 курси · від 320 ₴». Рахується з бази — див. lib/volumes.ts. */
      volume: (count: number, from: string) => string
      /** Коли за карткою поки нічого немає. */
      soon: string
      items: { title: string; subtitle: string; href: string; imageAlt: string }[]
    }
    afterPayment: {
      label: string
      title: string
      steps: { number: string; title: string; body: string }[]
    }
    journal: {
      label: string
      title: string
    }
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
    /** Склад набору на сторінці товару — поле «Що входить у набір». */
    kitIncludes: string
    addonsNote: string
    addonsEmpty: string
    addonsAdd: (count: number, sum: string) => string
    gallery: string
  }
  courses: {
    label: string
    title: string
    intro: string
    programme: string
    afterPayment: string
    /** Посилання на проєкт Canva біля майстер-класу. Видно лише покупцю. */
    openLesson: string
    /** Пояснення над програмою для того, хто курс уже купив. */
    lessonsUnlocked: string
    whatYouGet: string
    faq: string
    buy: string
    saved: string
    save: string
    forever: string
    levels: Record<string, string>
    perks: string[]
    // Каталог курсів. Раніше ці рядки лежали українською прямо в сторінці,
    // тож англійська версія каталогу показувала українські підписи.
    catalogTitle: string
    direction: string
    level: string
    all: string
    sort: string
    sortNew: string
    sortCheap: string
    sortExpensive: string
    filters: string
    allFilters: string
    reset: string
    found: (count: number) => string
    showCount: (count: number) => string
    empty: string
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
    postcode: string
    postcodeHint: string
    deliveryNote: string
    payment: string
    card: string
    comment: string
    commentPlaceholder: string
    /** Згода на розсилку при оформленні — галочка знята за замовчуванням. */
    newsletter: string
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
    /** Назви вкладок кабінету — вони ж заголовки відповідних сторінок. */
    tabs: { access: string; saved: string; delivery: string }
    accessEmpty: string
    /** Друга половина рядка «12 МК · доступ назавжди» під назвою курсу. */
    accessForever: string
    openTelegram: string
    preparing: string
    personalNote: string
    resend: string
    resending: string
    savedEmpty: string
    chooseCourse: string
    logout: string
    delivery: {
      contacts: string
      name: string
      phone: string
      email: string
      address: string
      method: string
      city: string
      branch: string
      payment: string
      card: string
      /** Підписи над списками в блоці «Оплата» — короткого «Спосіб» там замало. */
      paymentMethodLabel: string
      /** Прочерк замість значення, якого ще немає. */
      blank: string
      edit: string
      save: string
      saving: string
      failed: string
      close: string
      methods: Record<DeliveryMethod, string>
      payments: Record<PaymentMethod, string>
    }
  }
  reviews: {
    label: string
    /** Сам бал: у макеті це «4,9» поруч із зірками, без «з 5». */
    average: (value: number) => string
    count: (value: number) => string
    leave: string
    sent: string
    namePlaceholder: string
    cityPlaceholder: string
    rating: string
    textPlaceholder: string
    submit: string
    cancel: string
    empty: string
    moderationNote: string
    /** Підписи стрілок стрічки — видно лише читачам екрана. */
    prev: string
    next: string
    failed: string
    offline: string
  }
  journal: {
    label: string
    title: string
    all: string
    months: string[]
    empty: string
    fromArticle: string
    learn: string
  }
  search: { label: string; placeholder: string; submit: string; found: (n: number) => string; nothing: string }
  thanks: { paidTitle: string; acceptedTitle: string; pending: string; courseNote: string; shipNote: string; waiting: string; toShop: string; myAccess: string }
  portal: {
    learnLabel: string
    shopLabel: string
    learnAlt: string
    shopAlt: string
    logoAlt: string
  }
}

const uk: Dictionary = {
  nav: {
    home: 'Головна',
    journal: 'Журнал',
    courses: 'Курси',
    shop: 'Магазин',
    about: 'Про бренд',
    allCourses: 'Усі курси',
    allProducts: 'Усі товари',
    learn: 'Навчання',
    finished: 'Готові вироби',
  },
  header: {
    menu: 'Відкрити меню',
    closeMenu: 'Закрити меню',
    search: 'Пошук',
    account: 'Кабінет',
    cart: 'Кошик',
    home: 'STAN_UA — головна',
  },
  cart: {
    title: 'Кошик',
    empty: 'Тут поки порожньо.',
    chooseCourse: 'Обрати курс',
    chooseProduct: 'Обрати товар',
    total: 'Разом',
    deliveryNote: 'Вартість доставки рахується на наступному кроці.',
    checkout: 'Оформити',
    forever: 'Доступ назавжди',
    remove: 'Прибрати',
    less: 'Менше',
    more: 'Більше',
    close: 'Закрити',
    freeDeliveryLeft: 'До безкоштовної доставки — ще {sum}',
    freeDeliveryReached: 'Доставка безкоштовна',
    summary: 'Підсумок',
    items: 'Товари',
    delivery: 'Доставка',
    deliveryAtCheckout: 'Розрахуємо на оформленні',
    toPay: 'До сплати',
    inStock: 'В наявності',
    instantAccess: 'Доступ одразу',
    telegramForever: 'Доступ у Telegram · назавжди',
    colorLabel: 'Колір',
    sizeLabel: 'Розмір',
    mayLike: 'Може сподобатись',
    add: 'Додати +',
    placeOrder: 'Оформити замовлення',
  },
  footer: {
    tagline: 'Прикраси ручної роботи та майстер-класи з вʼязання, бісероплетіння й макраме.',
    subscribe: 'Новинки й знижки на пошту',
    subscribeCta: 'Підписатись',
    subscribed: 'Готово. Тепер новинки приходитимуть вам першою.',
    offer: 'Публічна оферта',
    privacy: 'Політика конфіденційності',
    columns: { courses: 'Курси', shop: 'Магазин', brand: 'Бренд' },
    links: {
      allDirections: 'Усі напрями',
      myAccess: 'Мої доступи',
      savedCourses: 'Збережені',
      faq: 'Часті питання',
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
    found: (count: number) => plural(count, 'позиція', 'позиції', 'позицій'),
    empty: 'За цими умовами нічого немає.',
    reset: 'Скинути фільтри',
    priceRanges: ['до 500 ₴', '500–1000 ₴', 'від 1000 ₴'],
    filters: 'Фільтри',
    allFilters: 'Всі фільтри',
    availability: 'Наявність',
    showCount: (count: number) => `Показати ${plural(count, 'товар', 'товари', 'товарів')}`,
  },
  product: {
    color: 'Колір',
    size: 'Розмір',
    inStock: 'В наявності',
    lastLeft: (count: number) => `Лишилось ${count} шт — ручна робота, партії маленькі`,
    outOfStock: 'Немає в наявності. Напишіть нам — зробимо під замовлення.',
    addToCart: 'Додати в кошик',
    delivery: 'Доставка',
    deliveryValue: 'Нова Пошта · Укрпошта',
    payment: 'Оплата',
    paymentValue: 'Картка · Apple Pay · Google Pay',
    madeBy: 'Виготовлення',
    madeByValue: '2–3 дні',
    related: 'Схоже',
    addonsTitle: 'Докупити до набору',
    kitIncludes: 'Що входить у набір',
    addonsNote: 'Дрібниці, яких зазвичай не вистачає.',
    addonsEmpty: 'Оберіть, що додати',
    addonsAdd: (count: number, sum: string) => `Додати ${count} · ${sum}`,
    gallery: 'Фото товару',
  },
  courses: {
    label: 'Курси',
    title: 'Навчимо робити руками. Далі — самі.',
    intro:
      'Кожен курс — це набір майстер-класів: відео, схеми й рекомендації з матеріалів. Після оплати доступ приходить автоматично й лишається назавжди.',
    programme: 'Програма',
    afterPayment: 'Після оплати',
    openLesson: 'Відкрити матеріали',
    lessonsUnlocked: 'Курс ваш — матеріали кожного майстер-класу відкриваються за посиланням.',
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
    catalogTitle: 'Усі курси й майстер-класи',
    direction: 'Напрям',
    level: 'Рівень',
    all: 'Усі',
    sort: 'Сортування',
    sortNew: 'Спочатку нові',
    sortCheap: 'Дешевші спершу',
    sortExpensive: 'Дорожчі спершу',
    filters: 'Фільтри',
    allFilters: 'Всі фільтри',
    reset: 'Скинути фільтри',
    found: (count: number) => plural(count, 'курс', 'курси', 'курсів'),
    showCount: (count: number) => `Показати ${plural(count, 'курс', 'курси', 'курсів')}`,
    empty: 'Нічого не знайшли за цими умовами.',
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
    postcode: 'Поштовий індекс',
    postcodeHint: "П'ять цифр — індекс відділення Укрпошти за адресою.",
    deliveryNote: 'Доставка за тарифами перевізника.',
    payment: 'Оплата',
    card: 'Карткою онлайн · Apple Pay · Google Pay',
    comment: 'Коментар',
    commentPlaceholder: 'Побажання до замовлення',
    newsletter: 'Хочу отримувати новини про нові курси й товари',
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
    tabs: { access: 'Мої доступи', saved: 'Збережені', delivery: 'Дані для доставки' },
    accessEmpty: 'Тут зʼявляться курси, які ви купите.',
    // З малої: у макеті це середина рядка «12 МК · доступ назавжди».
    accessForever: 'доступ назавжди',
    openTelegram: 'Відкрити в Telegram',
    preparing: 'Посилання готується',
    personalNote: 'Посилання персональні — не пересилайте їх іншим.',
    resend: 'Видати посилання ще раз',
    resending: 'Випускаємо…',
    savedEmpty: 'Тут зʼявляться курси, які ви збережете серцем.',
    chooseCourse: 'Обрати курс',
    logout: 'Вийти',
    delivery: {
      contacts: 'Контакти',
      name: 'Імʼя',
      phone: 'Телефон',
      email: 'Пошта',
      address: 'Адреса доставки',
      method: 'Спосіб',
      city: 'Місто',
      branch: 'Відділення',
      payment: 'Оплата',
      card: 'Картка',
      paymentMethodLabel: 'Спосіб оплати',
      blank: '—',
      edit: 'Змінити',
      save: 'Зберегти',
      saving: 'Зберігаємо…',
      failed: 'Не вдалось зберегти',
      close: 'Закрити',
      methods: {
        np_branch: 'Нова Пошта — відділення',
        np_locker: 'Нова Пошта — поштомат',
        np_courier: 'Нова Пошта — курʼєр',
        ukrposhta: 'Укрпошта',
      },
      payments: { card: 'Карткою онлайн' },
    },
  },
  reviews: {
    label: 'Відгуки',
    // Кома, а не крапка: в макеті «4,9».
    average: (value: number) => value.toFixed(1).replace('.', ','),
    count: (value: number) => plural(value, 'відгук', 'відгуки', 'відгуків'),
    leave: 'Написати відгук',
    sent: 'Дякуємо! Відгук зʼявиться на сайті після перевірки.',
    namePlaceholder: 'Як вас звати',
    cityPlaceholder: 'Місто (не обовʼязково)',
    rating: 'Оцінка',
    textPlaceholder: 'Що сподобалось, що ні',
    submit: 'Надіслати',
    cancel: 'Скасувати',
    empty: 'Відгуків поки немає. Будете першою.',
    moderationNote: 'Відгук зʼявиться після перевірки — зазвичай протягом дня.',
    prev: 'Попередні відгуки',
    next: 'Наступні відгуки',
    failed: 'Не вдалось надіслати',
    offline: 'Немає звʼязку з сервером',
  },
  journal: {
    label: 'ЖУРНАЛ',
    title: 'Гайди й поради про ручну роботу',
    all: 'УСІ',
    // Родовий відмінок: «20 березня», а не «20 березень». У картці місяць
    // показується капслоком, тому тут він лишається малими — регістр робить CSS.
    months: [
      'січня', 'лютого', 'березня', 'квітня', 'травня', 'червня',
      'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня',
    ],
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
  portal: {
    learnLabel: 'НАВЧАННЯ',
    shopLabel: 'ГОТОВІ ВИРОБИ',
    learnAlt: 'Курси з в’язання, бісероплетіння й макраме',
    shopAlt: 'Прикраси ручної роботи',
    logoAlt: 'STAN_UA market',
  },
  shopLanding: {
    hero: {
      label: 'ГОТОВІ ВИРОБИ',
      title: 'Прикраси ручної роботи.\nКожна — в одному екземплярі.',
      body: 'Вощений шнур, японський бісер і натуральна пряжа. Плетемо самі, невеликими партіями.',
      cta: 'ДО КАТАЛОГУ',
      imageAlt: 'Браслет із рожевого золота та перлин',
    },
    categories: {
      label: 'ГОТОВІ ВИРОБИ',
      title: 'Категорії',
      volume: (count: number, from: string) =>
        `${plural(count, 'товар', 'товари', 'товарів')} · від ${from}`,
      soon: 'Поповнюється',
      items: [
        {
          title: 'Прикраси з бісеру',
          subtitle: 'Браслети, кольє, сережки, чокери',
          href: '/shop/catalog?category=prykrasy',
          imageAlt: 'Кольє з бісеру ручної роботи',
        },
        {
          title: 'В’язані вироби',
          subtitle: 'Усе для першої роботи в одній коробці',
          href: '/shop/catalog?category=nabory',
          imageAlt: 'Гачки, пряжа й в’язані зразки',
        },
        {
          title: 'Аксесуари макраме',
          subtitle: 'Шнур, пряжа, фурнітура',
          href: '/shop/catalog?category=materialy',
          imageAlt: 'Шнур і фурнітура для макраме',
        },
      ],
    },
    delivery: {
      label: 'ДОСТАВКА Й ОПЛАТА',
      title: 'Надішлемо за 2–3 дні.\nОплата — як зручно.',
      steps: [
        {
          number: '01',
          title: 'Оформлюєте замовлення',
          body: 'Обираєте колір і розмір, платите карткою, Apple Pay або Google Pay.',
        },
        {
          number: '02',
          title: 'Пакуємо й відправляємо',
          body: 'Збираємо за 2–3 дні. Крихке — у жорстку коробку, з подарунковим пакуванням.',
        },
        {
          number: '03',
          title: 'Отримуєте',
          body: 'Нова Пошта — відділення, поштомат або курʼєр до дверей. Є й Укрпошта.',
        },
      ],
    },
    journal: {
      label: 'ЖУРНАЛ',
      title: 'Що почитати про ручну роботу',
    },
  },
  coursesLanding: {
    hero: {
      label: 'НАВЧАННЯ',
      title: 'Навчимо з нуля.\nБез досвіду й спецінструментів.',
      body: 'Курси й окремі майстер-класи з вʼязання, бісероплетіння та макраме. Доступ лишається назавжди.',
      cta: 'ДО КУРСІВ',
      imageAlt: 'Руки за роботою над плетінням',
    },
    directions: {
      label: 'НАВЧАННЯ',
      title: 'Напрями',
      volume: (count: number, from: string) =>
        `${plural(count, 'курс', 'курси', 'курсів')} · від ${from}`,
      soon: 'Скоро',
      items: [
        {
          title: 'Вʼязання',
          subtitle: 'Гачок і спиці',
          href: '/courses/viazannia',
          imageAlt: 'Вʼязання гачком',
        },
        {
          title: 'Бісероплетіння',
          subtitle: 'Дрібний бісер і волосінь',
          href: '/courses/biseropletinnia',
          imageAlt: 'Бісер у розсипі',
        },
        {
          title: 'Макраме',
          subtitle: 'Вузли й шнур',
          href: '/courses/makrame',
          imageAlt: 'Макраме на деревʼяному кільці',
        },
        // Четверта картка є в макеті, але її підпис там дослівно скопійований
        // з вʼязання, а сам шар досі зветься «Напрям — Вʼязання». Веде вона не
        // в курси, а в набори магазину, тому й обсяг рахується по товарах.
        {
          title: 'Готові набори',
          subtitle: 'Усе для першої роботи в одній коробці',
          href: '/shop/catalog?category=nabory',
          imageAlt: 'Готовий набір для рукоділля',
        },
      ],
    },
    afterPayment: {
      label: 'ПІСЛЯ ОПЛАТИ',
      title: 'Доступ приходить сам.\nПересилати нічого не треба.',
      steps: [
        {
          number: '01',
          title: 'Обираєте курс і платите карткою',
          body: 'Просто на сайті, без листування й пересилання реквізитів. Apple Pay і Google Pay теж працюють.',
        },
        {
          number: '02',
          title: 'Одразу отримуєте доступ',
          body: 'Запрошення в закритий Telegram-канал приходить автоматично — за хвилину після оплати.',
        },
        {
          number: '03',
          title: 'Дивитесь, коли зручно',
          body: 'Відео, схеми й рекомендації лишаються з вами назавжди. Термін доступу не спливає.',
        },
      ],
    },
    journal: {
      label: 'ЖУРНАЛ',
      title: 'Читати перед першим МК',
    },
  },
}

const en: Dictionary = {
  nav: {
    home: 'Home',
    journal: 'Journal',
    courses: 'Courses',
    shop: 'Shop',
    about: 'About',
    allCourses: 'All courses',
    allProducts: 'All products',
    learn: 'Learning',
    finished: 'Finished pieces',
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
    chooseProduct: 'Browse products',
    total: 'Total',
    deliveryNote: 'Shipping is calculated at the next step.',
    checkout: 'Checkout',
    forever: 'Lifetime access',
    remove: 'Remove',
    less: 'Less',
    more: 'More',
    close: 'Close',
    freeDeliveryLeft: '{sum} away from free shipping',
    freeDeliveryReached: 'Free shipping unlocked',
    summary: 'Summary',
    items: 'Items',
    delivery: 'Shipping',
    deliveryAtCheckout: 'Calculated at checkout',
    toPay: 'To pay',
    inStock: 'In stock',
    instantAccess: 'Instant access',
    telegramForever: 'Telegram access · forever',
    colorLabel: 'Colour',
    sizeLabel: 'Size',
    mayLike: 'You may like',
    add: 'Add +',
    placeOrder: 'Place order',
  },
  footer: {
    tagline: 'Handmade jewellery and master classes in knitting, beadwork and macramé.',
    subscribe: 'New arrivals and offers by email',
    subscribeCta: 'Subscribe',
    subscribed: 'Done. You will hear about new pieces first.',
    offer: 'Terms of sale',
    privacy: 'Privacy policy',
    columns: { courses: 'Courses', shop: 'Shop', brand: 'Brand' },
    links: {
      allDirections: 'All directions',
      myAccess: 'My access',
      savedCourses: 'Saved',
      faq: 'FAQ',
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
    filters: 'Filters',
    allFilters: 'All filters',
    availability: 'Availability',
    showCount: (count: number) => `Show ${count} products`,
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
    kitIncludes: 'What’s in the kit',
    addonsNote: 'The small things people usually run out of.',
    addonsEmpty: 'Choose what to add',
    addonsAdd: (count: number, sum: string) => `Add ${count} · ${sum}`,
    gallery: 'Product photos',
  },
  courses: {
    label: 'Courses',
    title: 'We teach the craft. The rest is yours.',
    intro:
      'Every course is a set of master classes: video, patterns and material notes. Access arrives automatically after payment and stays for good.',
    programme: 'Programme',
    afterPayment: 'After payment',
    openLesson: 'Open materials',
    lessonsUnlocked: 'The course is yours — each master class opens by its own link.',
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
    catalogTitle: 'All courses and master classes',
    direction: 'Craft',
    level: 'Level',
    all: 'All',
    sort: 'Sort',
    sortNew: 'Newest first',
    sortCheap: 'Price: low to high',
    sortExpensive: 'Price: high to low',
    filters: 'Filters',
    allFilters: 'All filters',
    reset: 'Clear filters',
    found: (count: number) => `${count} ${count === 1 ? 'course' : 'courses'}`,
    showCount: (count: number) => `Show ${count} ${count === 1 ? 'course' : 'courses'}`,
    empty: 'Nothing matches these filters.',
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
    postcode: 'Postcode',
    postcodeHint: 'Five digits — the Ukrposhta postcode for this address.',
    deliveryNote: 'Shipping is charged at the carrier rate.',
    payment: 'Payment',
    card: 'Card online · Apple Pay · Google Pay',
    comment: 'Note',
    commentPlaceholder: 'Anything we should know',
    newsletter: 'Send me news about new courses and products',
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
    tabs: { access: 'My access', saved: 'Saved', delivery: 'Delivery details' },
    accessEmpty: 'Courses you buy will appear here.',
    accessForever: 'lifetime access',
    openTelegram: 'Open in Telegram',
    preparing: 'Link is being prepared',
    personalNote: 'These links are personal - please do not forward them.',
    resend: 'Issue the link again',
    resending: 'Issuing…',
    savedEmpty: 'Courses you save with the heart will appear here.',
    chooseCourse: 'Browse courses',
    logout: 'Sign out',
    delivery: {
      contacts: 'Contacts',
      name: 'Name',
      phone: 'Phone',
      email: 'Email',
      address: 'Delivery address',
      method: 'Method',
      city: 'City',
      branch: 'Branch',
      payment: 'Payment',
      card: 'Card',
      paymentMethodLabel: 'Payment method',
      blank: '—',
      edit: 'Edit',
      save: 'Save',
      saving: 'Saving…',
      failed: 'Could not save',
      close: 'Close',
      methods: {
        np_branch: 'Nova Poshta - branch',
        np_locker: 'Nova Poshta - locker',
        np_courier: 'Nova Poshta - courier',
        ukrposhta: 'Ukrposhta',
      },
      payments: { card: 'Card online' },
    },
  },
  reviews: {
    label: 'Reviews',
    average: (value: number) => value.toFixed(1),
    count: (value: number) => `${value} ${value === 1 ? 'review' : 'reviews'}`,
    leave: 'Write a review',
    sent: 'Thank you! Your review appears once we have checked it.',
    namePlaceholder: 'Your name',
    cityPlaceholder: 'City (optional)',
    rating: 'Rating',
    textPlaceholder: 'What you liked, what you did not',
    submit: 'Send',
    cancel: 'Cancel',
    empty: 'No reviews yet. Be the first.',
    moderationNote: 'Your review appears after a quick check — usually within a day.',
    prev: 'Previous reviews',
    next: 'Next reviews',
    failed: 'Could not send the review',
    offline: 'No connection to the server',
  },
  journal: {
    label: 'JOURNAL',
    title: 'Guides and tips about handmade',
    all: 'ALL',
    months: [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ],
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
  portal: {
    learnLabel: 'LEARN',
    shopLabel: 'FINISHED PIECES',
    learnAlt: 'Courses in knitting, beadwork and macramé',
    shopAlt: 'Handmade jewellery',
    logoAlt: 'STAN_UA market',
  },
  shopLanding: {
    hero: {
      label: 'FINISHED PIECES',
      title: 'Handmade jewellery.\nEach one, a single copy.',
      body: 'Waxed cord, Japanese seed beads and natural yarn. We weave everything ourselves, in small batches.',
      cta: 'BROWSE THE CATALOGUE',
      imageAlt: 'Rose-gold and pearl bracelet',
    },
    categories: {
      label: 'FINISHED PIECES',
      title: 'Categories',
      volume: (count: number, from: string) =>
        `${count} ${count === 1 ? 'item' : 'items'} · from ${from}`,
      soon: 'Restocking',
      items: [
        {
          title: 'Beaded jewellery',
          subtitle: 'Bracelets, necklaces, earrings, chokers',
          href: '/shop/catalog?category=prykrasy',
          imageAlt: 'Handmade beaded necklace',
        },
        {
          title: 'Knitted pieces',
          subtitle: 'Everything you need for a first project, in one box',
          href: '/shop/catalog?category=nabory',
          imageAlt: 'Hooks, yarn and knitted swatches',
        },
        {
          title: 'Macramé supplies',
          subtitle: 'Cord, yarn, findings',
          href: '/shop/catalog?category=materialy',
          imageAlt: 'Macramé cord and findings',
        },
      ],
    },
    delivery: {
      label: 'SHIPPING & PAYMENT',
      title: 'We ship in 2–3 days.\nPay however suits you.',
      steps: [
        {
          number: '01',
          title: 'You place the order',
          body: 'Pick colour and size, pay by card, Apple Pay or Google Pay.',
        },
        {
          number: '02',
          title: 'We pack and dispatch',
          body: 'Assembled in 2–3 days. Fragile pieces travel in rigid boxes with gift wrapping.',
        },
        {
          number: '03',
          title: 'You receive it',
          body: 'Nova Poshta — branch, locker or courier to the door. Ukrposhta is also available.',
        },
      ],
    },
    journal: {
      label: 'JOURNAL',
      title: 'Reading about the craft',
    },
  },
  coursesLanding: {
    hero: {
      label: 'COURSES',
      title: 'Learn from scratch.\nNo experience or special tools.',
      body: 'Courses and standalone master classes in knitting, beadwork and macramé. Access stays yours for good.',
      cta: 'BROWSE COURSES',
      imageAlt: 'Hands at work on a woven piece',
    },
    directions: {
      label: 'COURSES',
      title: 'Crafts',
      volume: (count: number, from: string) =>
        `${count} ${count === 1 ? 'course' : 'courses'} · from ${from}`,
      soon: 'Coming soon',
      items: [
        {
          title: 'Knitting',
          subtitle: 'Hooks and needles',
          href: '/courses/viazannia',
          imageAlt: 'Crocheting in progress',
        },
        {
          title: 'Beadwork',
          subtitle: 'Small beads and fine line',
          href: '/courses/biseropletinnia',
          imageAlt: 'Loose beads',
        },
        {
          title: 'Macramé',
          subtitle: 'Knots and cord',
          href: '/courses/makrame',
          imageAlt: 'Macramé on a wooden hoop',
        },
        {
          title: 'Ready-made kits',
          subtitle: 'Everything you need for a first project, in one box',
          href: '/shop/catalog?category=nabory',
          imageAlt: 'A ready-made craft kit',
        },
      ],
    },
    afterPayment: {
      label: 'AFTER PAYMENT',
      title: 'Access arrives on its own.\nNothing to forward.',
      steps: [
        {
          number: '01',
          title: 'Pick a course and pay by card',
          body: 'Right on the site, with no messaging back and forth. Apple Pay and Google Pay work too.',
        },
        {
          number: '02',
          title: 'Get access immediately',
          body: 'An invite to the private Telegram channel arrives automatically, about a minute after payment.',
        },
        {
          number: '03',
          title: 'Watch whenever suits you',
          body: 'Videos, patterns and material notes stay with you for good. Access never expires.',
        },
      ],
    },
    journal: {
      label: 'JOURNAL',
      title: 'Read before your first class',
    },
  },
}

const DICTIONARIES: Record<Locale, Dictionary> = { uk, en }

export const dictionary = (locale: Locale): Dictionary => DICTIONARIES[locale] ?? DICTIONARIES.uk
