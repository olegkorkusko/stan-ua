import type { Metadata } from 'next'
import Image from 'next/image'

import { getLocale } from '@/lib/locale'
import { imageAlt, imageUrl } from '@/lib/media'
import { payloadClient } from '@/lib/payload'

export const dynamic = 'force-dynamic'

/*
  «Про бренд» за макетом (94:2011 на 1440, 309:5754 на 390).

  Три смуги впритул одна до одної, без проміжків: вступ, фото на всю ширину
  й цінності. Вертикальні поля кожна несе сама — 96/80 і 96/120 на десктопі,
  56/40 і 48/64 на мобільному. Тому тут немає ні `.page-y`, ні спільного
  контейнера: він задав би однакові відступи всім трьом.

  Фото свідомо поза `.shell`: у макеті воно від краю до краю кадру (1440 і
  390), а не в колонці 1360.

  Текст приходить із глобала «Про бренд»: у макеті це не rich text, а окремі
  слоти, і кожен має власний вигляд.
*/

const loadAbout = async () => {
  const payload = await payloadClient()
  const locale = await getLocale()
  return payload.findGlobal({ slug: 'about', locale, depth: 1 }).catch(() => null)
}

export const generateMetadata = async (): Promise<Metadata> => {
  const about = await loadAbout()
  return {
    title: about?.title || 'Про бренд',
    description: about?.lead || undefined,
  }
}

const VALUE_NODES = [
  { root: '94:2093', rule: '94:2094', title: '94:2095', description: '94:2096' },
  { root: '94:2097', rule: '94:2098', title: '94:2099', description: '94:2100' },
  { root: '94:2101', rule: '94:2102', title: '94:2103', description: '94:2104' },
]

const AboutPage = async () => {
  const about = await loadAbout()
  const photo = imageUrl(about?.photo, 'hero')
  const values = about?.values ?? []

  return (
    <>
      <section
        data-figma-node="94:2083"
        data-figma-state="default"
        className="shell flex flex-col gap-6 pb-10 pt-14 md:gap-18 md:pb-20 md:pt-24"
      >
        <div data-figma-node="94:2084" className="flex flex-col gap-6 md:flex-row md:gap-16">
          <div data-figma-node="94:2085" className="flex flex-1 flex-col gap-3">
            {about?.label && (
              <p data-figma-node="94:2086" className="text-eyebrow uppercase text-muted">
                {about.label.toUpperCase()}
              </p>
            )}
            <h1 data-figma-node="94:2087" className="text-title text-ink">
              {about?.title}
            </h1>
          </div>

          <div data-figma-node="94:2088" className="flex flex-1 flex-col gap-4">
            {about?.lead && (
              <p data-figma-node="94:2089" className="text-[15px] font-normal leading-6 text-ink">
                {about.lead}
              </p>
            )}
            {about?.body && (
              <p data-figma-node="94:2090" className="text-[15px] font-normal leading-6 text-muted">
                {about.body}
              </p>
            )}
          </div>
        </div>
      </section>

      <div
        data-figma-node="94:2091"
        className="relative h-80 w-full overflow-hidden bg-paper-deep md:h-[680px]"
      >
        {photo ? (
          <Image
            src={photo}
            alt={imageAlt(about?.photo, about?.title ?? '')}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <div className="weave h-full w-full" />
        )}
      </div>

      {values.length > 0 && (
        <section
          data-figma-node="108:2366"
          className="shell flex flex-col gap-14 pb-16 pt-12 md:pb-30 md:pt-24"
        >
          <div data-figma-node="94:2092" className="flex flex-col gap-7 md:flex-row md:gap-8">
            {values.map((value, index) => {
              const nodes = VALUE_NODES[index]

              return (
                <div
                  key={value.id ?? index}
                  data-figma-node={nodes?.root}
                  className="flex flex-1 flex-col gap-3"
                >
                  {/*
                    Нитка над кожною цінністю — прямокутник із заливкою, а не
                    рамка сусіда: у макеті (94:2094) вона належить самому
                    блоку й має власний колір, темніший за звичайну волосінь.
                  */}
                  <div data-figma-node={nodes?.rule} className="h-px w-full bg-hairline-bold" />
                  <h2
                    data-figma-node={nodes?.title}
                    className="font-display text-[17px] font-normal leading-[22px] tracking-[-0.005em] text-ink"
                  >
                    {value.title}
                  </h2>
                  {value.description && (
                    <p
                      data-figma-node={nodes?.description}
                      className="text-[13px] font-normal leading-5 text-muted"
                    >
                      {value.description}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}

export default AboutPage
