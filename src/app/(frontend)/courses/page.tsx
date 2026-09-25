import type { Metadata } from 'next'
import Image from 'next/image'

import { HeroCta } from '@/components/site/HeroCta'
import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { formatPrice } from '@/lib/format'
import { dictionary } from '@/lib/i18n'
import { landingCopy } from '@/lib/landing'
import { getLocale } from '@/lib/locale'
import { categoryCards, cardKey, directionCards } from '@/lib/cards'
import { SectionLabel, SectionTitle } from '@/components/site/Typography'

// Не `force-static`: сторінка читає мову з заголовка запиту — див. lib/locale.ts
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Курси',
  description:
    'Майстер-класи з вʼязання, бісероплетіння та макраме. Доступ у закритий Telegram одразу після оплати, назавжди.',
}

// Напрями — чотири картки у двох рядах по дві, а не три в один ряд:
// «Категорії» 81:1449 має заголовок і два фрейми «Напрями» з проміжком 72.
const DIRECTION_CARDS = ['157:3691', '157:3696', '157:3701', '261:4317']
const DIRECTION_ROWS = [
  { id: '157:3690', cards: [0, 1] },
  { id: '261:4316', cards: [2, 3] },
]
const DIRECTION_IMAGES = [
  '/courses/dir-knitted.png',
  '/courses/dir-biseru.png',
  '/courses/dir-macrame.png',
  '/courses/dir-knitted-2.png',
]

/** Внутрішні ноди інстанса адресуються як I<картка>;<нода компонента>. */
const inner = (index: number, node: string) => `I${DIRECTION_CARDS[index]};${node}`

const STEP_ROOTS = ['102:2182', '102:2187', '102:2192']
const STEP_NUMBERS = ['102:2183', '102:2188', '102:2193']
const STEP_DIVIDERS = ['102:2184', '102:2189', '102:2194']
const STEP_TITLES = ['102:2185', '102:2190', '102:2195']
const STEP_BODIES = ['102:2186', '102:2191', '102:2196']

const CoursesPage = async () => {
  const locale = await getLocale()
  // Тексти з адмінки поверх текстів із коду — див. lib/landing.ts
  const t = await landingCopy('courses-page', locale, dictionary(locale).coursesLanding)

  /*
    Четверта картка веде не в курси, а в набори магазину, тому обсягів треба
    два набори: по напрямах і по категоріях. Слово теж різне — «курси» проти
    «товари», — і береться зі словника тієї секції, яка за цю картку відповідає.
  */
  const shopCopy = dictionary(locale).shopLanding.categories
  const [directions, categories] = await Promise.all([
    directionCards(locale),
    categoryCards(locale),
  ])

  const cardFor = (href: string) =>
    (href.startsWith('/courses/') ? directions : categories).get(cardKey(href) ?? '')

  const volumeFor = (href: string) => {
    const toCourses = href.startsWith('/courses/')
    const card = cardFor(href)
    if (!card || card.count === 0) return toCourses ? t.directions.soon : shopCopy.soon
    const label = toCourses ? t.directions.volume : shopCopy.volume
    return label(card.count, formatPrice(card.from))
  }

  return (
    <div data-figma-node="81:1377" data-figma-state="default" className="flex flex-col bg-paper">
      {/* Hero — 100:2176. Дзеркалить композицію /shop: фото на всю ширину,
          лівий градієнт до 78% і колонка тексту у .shell. */}
      <section
        data-figma-node="100:2176"
        aria-label={t.hero.imageAlt}
        className="relative h-[539px] w-full overflow-hidden bg-ink md:h-[720px]"
      >
        <Image
          src="/courses/hero.jpg"
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
          style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 78%)' }}
        />
        <div className="shell relative pt-20 md:pt-[305px]">
          <div data-figma-node="100:2177" className="flex w-full flex-col gap-5 md:max-w-[900px]">
            <p data-figma-node="100:2178" className="text-eyebrow uppercase text-paper">
              {t.hero.label}
            </p>
            <h1
              data-figma-node="100:2179"
              className="whitespace-pre-line font-display text-hero font-normal text-paper"
            >
              {t.hero.title}
            </h1>
            <p
              data-figma-node="100:2180"
              className="max-w-[440px] text-[15px] font-normal leading-[24px] text-paper"
            >
              {t.hero.body}
            </p>
            <div data-figma-node="100:2181" className="mt-3 flex items-center gap-3">
              <HeroCta href="/courses/catalog" node="100:2182" labelNode="I100:2182;10:13">
                {t.hero.cta}
              </HeroCta>
            </div>
          </div>
        </div>
      </section>

      {/* Directions — 81:1449. Той самий контейнер, що й «Категорії» у магазині. */}
      <section
        data-figma-node="81:1449"
        className="shell flex flex-col gap-7 bg-paper py-14 md:gap-[72px] md:py-[120px]"
      >
        <div data-figma-node="81:1450" className="flex flex-col gap-3">
          <SectionLabel data-figma-node="81:1451">{t.directions.label}</SectionLabel>
          <SectionTitle data-figma-node="81:1452">{t.directions.title}</SectionTitle>
        </div>
        {DIRECTION_ROWS.map((row) => (
          <div
            key={row.id}
            data-figma-node={row.id}
            className="flex flex-col gap-7 md:flex-row md:gap-6"
          >
            {row.cards.map((index) => {
              const item = t.directions.items[index]
              if (!item) return null
              const card = cardFor(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-figma-node={DIRECTION_CARDS[index]}
                  className="group flex flex-1 flex-col gap-5 bg-[#F4F4F4] transition-colors hover:bg-[#EBEBEB] active:bg-[#E0E0E0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  {/* На телефоні пропорція та сама, що в категорій магазину (398/294):
                      картки напрямів і категорій стоять в одному ритмі, а
                      висока 358/480 з'їдала півекрана на кожну. На десктопі
                      лишається 668/480 з макета. */}
                  <div className="relative aspect-398/294 w-full overflow-hidden md:aspect-[668/480]">
                    <Image
                      data-figma-node={inner(index, '19:3')}
                      src={card?.image ?? DIRECTION_IMAGES[index]}
                      alt={item.imageAlt}
                      fill
                      unoptimized
                      priority
                      sizes="(min-width: 768px) 50vw, 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div
                    data-figma-node={inner(index, '269:4375')}
                    className="flex flex-col gap-5 px-4 pb-4"
                  >
                    <div
                      data-figma-node={inner(index, '264:2')}
                      className="flex items-center justify-between gap-4 pr-1 transition-[padding] duration-300 group-hover:pr-0 motion-reduce:transition-none"
                    >
                      <span
                        data-figma-node={inner(index, '19:4')}
                        className="font-display text-[17px] font-normal leading-[21.76px] tracking-[-0.005em] text-ink"
                      >
                        {card?.title ?? item.title}
                      </span>
                      <span
                        data-figma-node={inner(index, '264:3')}
                        aria-hidden="true"
                        className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center opacity-[0.32] transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none"
                      >
                        <svg
                          data-figma-node={inner(index, '264:4')}
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
                      data-figma-node={inner(index, '19:5')}
                      className="text-[13px] font-normal leading-[19.5px] text-muted"
                    >
                      {card?.subtitle ?? item.subtitle}
                    </span>
                    <span
                      data-figma-node={inner(index, '19:6')}
                      className="text-[13px] font-normal leading-[19.5px] text-muted"
                    >
                      {volumeFor(item.href)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        ))}
      </section>

      {/* After payment — 102:2177. Заливка на всю ширину, вміст у .shell —
          як у секції «Доставка й оплата» магазину. */}
      <section data-figma-node="102:2177" className="w-full bg-[#F4F4F4] py-14 md:py-[120px]">
        <div className="shell flex flex-col gap-7 md:gap-16">
          <div data-figma-node="102:2178" className="flex flex-col gap-3">
            <SectionLabel data-figma-node="102:2179">{t.afterPayment.label}</SectionLabel>
            <h2
              data-figma-node="102:2180"
              className="whitespace-pre-line font-display text-title font-normal text-ink"
            >
              {t.afterPayment.title}
            </h2>
          </div>
          <div data-figma-node="102:2181" className="flex flex-col gap-7 md:flex-row md:gap-8">
            {t.afterPayment.steps.map((step, index) => (
              <div
                key={step.number}
                data-figma-node={STEP_ROOTS[index]}
                className="flex flex-1 flex-col gap-3"
              >
                <p
                  data-figma-node={STEP_NUMBERS[index]}
                  className="font-display text-[13px] font-normal leading-[16.9px] text-muted"
                >
                  {step.number}
                </p>
                <hr
                  data-figma-node={STEP_DIVIDERS[index]}
                  className="h-px w-full border-0 bg-[#16150F2E]"
                />
                <h3
                  data-figma-node={STEP_TITLES[index]}
                  className="font-body text-[15px] font-normal leading-[24px] tracking-normal text-ink"
                  style={{ fontFamily: 'var(--font-manrope), "Segoe UI", system-ui, sans-serif' }}
                >
                  {step.title}
                </h3>
                <p
                  data-figma-node={STEP_BODIES[index]}
                  className="text-[13px] font-normal leading-[19.5px] text-muted"
                >
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default CoursesPage
