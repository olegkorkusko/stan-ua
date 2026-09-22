import type { Metadata } from 'next'
import Image from 'next/image'

import { HeroCta } from '@/components/site/HeroCta'
import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { dictionary } from '@/lib/i18n'
import { landingCopy } from '@/lib/landing'
import { getLocale } from '@/lib/locale'
import { SectionLabel, SectionTitle } from '@/components/site/Typography'

// Не `force-static`: сторінка читає мову з заголовка запиту — див. lib/locale.ts
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Магазин',
  description: 'Прикраси ручної роботи, набори для створення та матеріали. Доставка Новою Поштою.',
}

const CATEGORY_IMAGES = ['/shop/cat-biseru.png', '/shop/cat-knitted.png', '/shop/cat-macrame.png']
const JOURNAL_IMAGES = [
  '/shop/journal-care.png',
  '/shop/journal-materials.png',
  '/shop/journal-sizes.png',
]

const CARD_NODE_IDS = ['158:3683', '158:3688', '158:3693']
const CARD_IMAGE_NODE_IDS = ['I158:3683;19:3', 'I158:3688;19:3', 'I158:3693;19:3']
const CARD_BODY_NODE_IDS = ['I158:3683;269:4375', 'I158:3688;269:4375', 'I158:3693;269:4375']
const CARD_ROW_NODE_IDS = ['I158:3683;264:2', 'I158:3688;264:2', 'I158:3693;264:2']
const CARD_TITLE_NODE_IDS = ['I158:3683;19:4', 'I158:3688;19:4', 'I158:3693;19:4']
const CARD_ARROW_NODE_IDS = ['I158:3683;264:3', 'I158:3688;264:3', 'I158:3693;264:3']
const CARD_ARROW_VEC_NODE_IDS = ['I158:3683;264:4', 'I158:3688;264:4', 'I158:3693;264:4']
const CARD_SUBTITLE_NODE_IDS = ['I158:3683;19:5', 'I158:3688;19:5', 'I158:3693;19:5']
const CARD_VOLUME_NODE_IDS = ['I158:3683;19:6', 'I158:3688;19:6', 'I158:3693;19:6']

const DELIVERY_STEP_ROOTS = ['99:2169', '99:2174', '99:2179']
const DELIVERY_STEP_NUMBERS = ['99:2170', '99:2175', '99:2180']
const DELIVERY_STEP_DIVIDERS = ['99:2171', '99:2176', '99:2181']
const DELIVERY_STEP_TEXT_ROOTS = ['99:2169', '99:2174', '99:2179']
const DELIVERY_STEP_TITLES = ['99:2172', '99:2177', '99:2182']
const DELIVERY_STEP_BODIES = ['99:2173', '99:2178', '99:2183']

const JOURNAL_CARD_ROOTS = ['99:2189', '99:2194', '99:2199']
const JOURNAL_CARD_IMAGES = ['I99:2189;97:3', 'I99:2194;97:3', 'I99:2199;97:3']
const JOURNAL_CARD_BODIES = ['I99:2189;162:4', 'I99:2194;162:4', 'I99:2199;162:4']
const JOURNAL_CARD_EYEBROWS = ['I99:2189;97:4', 'I99:2194;97:4', 'I99:2199;97:4']
const JOURNAL_CARD_TITLES = ['I99:2189;97:5', 'I99:2194;97:5', 'I99:2199;97:5']
const JOURNAL_CARD_BODIES_TEXT = ['I99:2189;97:6', 'I99:2194;97:6', 'I99:2199;97:6']

const ShopPage = async () => {
  const locale = await getLocale()
  // Тексти з адмінки поверх текстів із коду — див. lib/landing.ts
  const t = await landingCopy('shop-page', locale, dictionary(locale).shopLanding)

  return (
    <div data-figma-node="70:1050" className="bg-paper">
      {/* Hero — 98:2163 (a full-bleed photo band with left-anchored copy). */}
      <section
        data-figma-node="98:2163"
        data-figma-state="shop-hero"
        aria-label={t.hero.imageAlt}
        className="relative h-[561px] w-full overflow-hidden bg-ink md:h-[720px]"
      >
        <Image
          src="/shop/hero-photo.png"
          alt=""
          fill
          unoptimized
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0) 68%)' }}
        />
        {/*
          Смуга з фото йде на всю ширину, як у макеті, але текст усередині
          мусить стояти в тій самій колонці, що й шапка та секції нижче. Тому
          він загорнутий у .shell: без цього блок прив'язувався до краю вікна
          й на широких екранах висів лівіше за решту сторінки.
          Всередині — ширина шару «Текст» із макета (900), не 980.
        */}
        <div className="shell relative pt-20 md:pt-[305px]">
          <div data-figma-node="98:2164" className="flex w-full flex-col gap-5 md:max-w-[900px]">
            <p data-figma-node="98:2165" className="text-eyebrow uppercase text-paper">
              {t.hero.label}
            </p>
            <h1
              data-figma-node="98:2166"
              className="whitespace-pre-line font-display text-hero font-normal text-paper"
            >
              {t.hero.title}
            </h1>
            <p
              data-figma-node="98:2167"
              className="max-w-[440px] text-[15px] font-normal leading-[24px] text-paper"
            >
              {t.hero.body}
            </p>
            <div data-figma-node="98:2168" className="mt-3 flex items-center gap-3">
              <HeroCta href="/shop/catalog" node="98:2169" labelNode="I98:2169;10:13">
                {t.hero.cta}
              </HeroCta>
            </div>
          </div>
        </div>
      </section>

      {/* Categories — 70:1122. */}
      <section
        data-figma-node="70:1122"
        data-figma-state="shop-categories"
        className="shell flex flex-col gap-7 bg-paper py-14 md:gap-[72px] md:py-[120px]"
      >
        <div data-figma-node="71:1202" className="flex flex-col gap-3">
          <SectionLabel data-figma-node="71:1203">{t.categories.label}</SectionLabel>
          <SectionTitle data-figma-node="71:1204">{t.categories.title}</SectionTitle>
        </div>
        <div data-figma-node="158:3682" className="flex flex-col gap-7 md:flex-row md:gap-6">
          {t.categories.items.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              data-figma-node={CARD_NODE_IDS[index]}
              className="group flex flex-1 flex-col gap-5 bg-[#F4F4F4] transition-colors hover:bg-[#EBEBEB] active:bg-[#E0E0E0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <div className="relative aspect-[398/294] w-full overflow-hidden">
                <Image
                  data-figma-node={CARD_IMAGE_NODE_IDS[index]}
                  src={CATEGORY_IMAGES[index]}
                  alt={item.imageAlt}
                  fill
                  unoptimized
                  priority
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div
                data-figma-node={CARD_BODY_NODE_IDS[index]}
                className="flex flex-col gap-5 px-4 pb-4"
              >
                {/* Стрілка поводиться рівно як у варіанті «Стан=Наведення»:
                    з 32% проявляється до повної і зсувається на 4px до краю
                    (у спокої рядок має padding-right 4, у наведенні — 0).
                    Підсвітка фону картки — понад макет, свідоме рішення:
                    у Figma фон при наведенні не змінюється. */}
                <div
                  data-figma-node={CARD_ROW_NODE_IDS[index]}
                  className="flex items-center justify-between gap-4 pr-1 transition-[padding] duration-300 group-hover:pr-0 motion-reduce:transition-none"
                >
                  <span
                    data-figma-node={CARD_TITLE_NODE_IDS[index]}
                    className="font-display text-[17px] font-normal leading-[21.76px] tracking-[-0.005em] text-ink"
                  >
                    {item.title}
                  </span>
                  <span
                    data-figma-node={CARD_ARROW_NODE_IDS[index]}
                    aria-hidden="true"
                    className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center opacity-[0.32] transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
                  >
                    {/* Контур і розміри — з вектора в макеті: поле 14×11,
                        товщина 1.3, круглі кінці. */}
                    <svg
                      data-figma-node={CARD_ARROW_VEC_NODE_IDS[index]}
                      viewBox="0 0 14 11"
                      fill="none"
                      className="h-[11px] w-[14px] overflow-visible"
                    >
                      <path
                        d="M0 5.5H14M8.5 0L14 5.5L8.5 11"
                        stroke="#16150F"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
                <span
                  data-figma-node={CARD_SUBTITLE_NODE_IDS[index]}
                  className="text-[13px] font-normal leading-[19.5px] text-muted"
                >
                  {item.subtitle}
                </span>
                <span
                  data-figma-node={CARD_VOLUME_NODE_IDS[index]}
                  className="text-[13px] font-normal leading-[19.5px] text-muted"
                >
                  {item.volume}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Delivery — 99:2164. */}
      {/* Заливка секції йде на всю ширину вікна, а вміст лишається у спільній
          колонці. Тому фон і вертикальні відступи живуть на <section>, а .shell
          стоїть усередині: якщо повісити .shell на саму секцію, сіра смуга
          обмежиться 1440 і на ширших екранах не дійде до країв. */}
      <section
        data-figma-node="99:2164"
        data-figma-state="shop-delivery"
        className="w-full bg-[#F4F4F4] py-14 md:py-[120px]"
      >
        <div className="shell flex flex-col gap-7 md:gap-16">
          <div data-figma-node="99:2165" className="flex flex-col gap-3">
            <SectionLabel data-figma-node="99:2166">{t.delivery.label}</SectionLabel>
            <h2
              data-figma-node="99:2167"
              className="whitespace-pre-line font-display text-title font-normal text-ink"
            >
              {t.delivery.title}
            </h2>
          </div>
          <div data-figma-node="99:2168" className="flex flex-col gap-7 md:flex-row md:gap-8">
            {t.delivery.steps.map((step, index) => (
              <div
                key={step.number}
                data-figma-node={DELIVERY_STEP_ROOTS[index]}
                className="flex flex-1 flex-col gap-3"
              >
                <p
                  data-figma-node={DELIVERY_STEP_NUMBERS[index]}
                  className="font-display text-[13px] font-normal leading-[16.9px] text-muted"
                >
                  {step.number}
                </p>
                <hr
                  data-figma-node={DELIVERY_STEP_DIVIDERS[index]}
                  className="h-px w-full border-0 bg-[#16150F2E]"
                />
                <div
                  data-figma-node={DELIVERY_STEP_TEXT_ROOTS[index]}
                  className="flex flex-col gap-3"
                >
                  <h3
                    data-figma-node={DELIVERY_STEP_TITLES[index]}
                    className="font-body text-[15px] font-normal leading-[24px] tracking-normal text-ink"
                    style={{ fontFamily: 'var(--font-manrope), "Segoe UI", system-ui, sans-serif' }}
                  >
                    {step.title}
                  </h3>
                  <p
                    data-figma-node={DELIVERY_STEP_BODIES[index]}
                    className="text-[13px] font-normal leading-[19.5px] text-muted"
                  >
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journal — 99:2184. */}
      <section
        data-figma-node="99:2184"
        data-figma-state="shop-journal"
        className="shell flex flex-col gap-7 bg-paper py-14 md:gap-16 md:py-[120px]"
      >
        <div data-figma-node="99:2185" className="flex flex-col gap-3">
          <SectionLabel data-figma-node="99:2186">{t.journal.label}</SectionLabel>
          <SectionTitle data-figma-node="99:2187">{t.journal.title}</SectionTitle>
        </div>
        <div data-figma-node="99:2188" className="flex flex-col gap-7 md:flex-row md:gap-6">
          {t.journal.items.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              data-figma-node={JOURNAL_CARD_ROOTS[index]}
              className="group flex flex-1 flex-col items-center gap-[18px] border border-[#EFE9DF] transition-colors hover:border-[#16150F] active:bg-[#F2EFE9] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <div className="relative aspect-[397/265] w-full overflow-hidden">
                <Image
                  data-figma-node={JOURNAL_CARD_IMAGES[index]}
                  src={JOURNAL_IMAGES[index]}
                  alt={item.imageAlt}
                  fill
                  unoptimized
                  priority
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div
                data-figma-node={JOURNAL_CARD_BODIES[index]}
                className="flex w-full flex-col gap-[18px] px-4 pb-4"
              >
                <span
                  data-figma-node={JOURNAL_CARD_EYEBROWS[index]}
                  className="text-eyebrow uppercase text-muted"
                >
                  {item.eyebrow}
                </span>
                <span
                  data-figma-node={JOURNAL_CARD_TITLES[index]}
                  className="font-display text-[17px] font-normal leading-[21.76px] tracking-[-0.005em] text-ink"
                >
                  {item.title}
                </span>
                <span
                  data-figma-node={JOURNAL_CARD_BODIES_TEXT[index]}
                  className="text-[13px] font-normal leading-[19.5px] text-muted"
                >
                  {item.body}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

export default ShopPage
