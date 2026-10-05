import Image from 'next/image'

import { CardVideo } from '@/components/site/CardVideo'
import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { Picture } from '@/components/site/Picture'
import { SaveButton } from '@/components/site/SaveButton'
import { formatPrice } from '@/lib/format'
import { productCard } from '@/lib/product-media'
import type { Product } from '@/payload-types'

/*
  Картка товару за макетом: десктопна «Картка товару» (272:4465) і окремий
  мобільний компонент «Картка товару / Моб» (326:2). Вони різняться не лише
  розміром:

              десктоп (300×486)        мобайл (190×296)
  кадр        300×400                  190×228
  текст       gap 18, падінг 16        gap 5, падінг 10
  назва/ціна  в один рядок             стовпцем
  ціна        Unbounded 13/16.9        Manrope 13/17.8
  кружечки    14×14, gap 6, flax       10×10, gap 5, ink

  Наведення в макеті — зум фото всередині кадру (300×400 → 321×428, ~7%),
  рамка при цьому тримає розмір. Тому кадр кліпить вміст, а масштабується
  тільки зображення.

  Понад макет у кадрі живуть ще два шари: друге фото й ролик. Обидва
  зʼявляються при наведенні, обидва наближаються так само, як перше фото —
  тому клас наближення спільний, а не переписаний утретє.
*/
const SIZES = '(max-width: 768px) 50vw, 25vw'

const ZOOM =
  'transition-transform duration-500 ease-out group-hover:scale-[1.07] motion-reduce:transition-none motion-reduce:group-hover:scale-100'

export const ProductCard = ({
  product,
  saved = false,
  authorized = false,
}: {
  product: Product
  saved?: boolean
  authorized?: boolean
}) => {
  const { cover, coverAlt, hover, video } = productCard(product)

  const colors = (product.variants ?? [])
    .map((variant) => (typeof variant.color === 'object' ? variant.color : null))
    .filter((color): color is NonNullable<typeof color> => Boolean(color))
    .filter((color, index, all) => all.findIndex((c) => c.id === color.id) === index)

  return (
    <article className="group relative flex flex-col gap-3 bg-[#F4F4F4] md:gap-[18px]">
      <div className="relative aspect-[190/228] overflow-hidden bg-paper-deep md:aspect-[348/400]">
        <Picture
          src={cover}
          alt={coverAlt}
          fill
          sizes={SIZES}
          quality={85}
          className={`object-cover ${ZOOM}`}
        />

        {/* Друге фото при наведенні — те, що підказка в адмінці обіцяє від
            самого початку, але чого картка досі не вміла. Наближається разом
            із першим, інакше на півдорозі вони їхали б урізнобіч. */}
        {hover && (
          <Image
            src={hover}
            alt=""
            aria-hidden="true"
            fill
            sizes={SIZES}
            quality={85}
            className={`object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 ${ZOOM}`}
          />
        )}

        {/* Відео поверх обох: якщо воно є, саме воно й оживає. */}
        {video && <CardVideo src={video} className={ZOOM} />}

        {!product.inStock && (
          <span className="absolute left-3 top-3 bg-paper/90 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
            Немає
          </span>
        )}
      </div>

      <div className="flex flex-col gap-[5px] px-2.5 pb-2.5 md:gap-[18px] md:px-4 md:pb-4">
        <div className="flex items-start gap-2.5 md:gap-3.5">
          <div className="flex min-w-0 flex-1 flex-col gap-[5px] md:flex-row md:items-start md:justify-between md:gap-3.5">
            <h3 className="font-body text-[13px] font-normal leading-[17.8px] text-ink md:text-[15px] md:leading-[20.25px]">
              <Link
                href={`/shop/${product.slug}`}
                className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                {product.title}
              </Link>
            </h3>
            <span className="shrink-0 text-[13px] font-normal leading-[17.8px] text-ink md:font-display md:leading-[16.9px]">
              {formatPrice(product.priceFrom ?? product.price)}
            </span>
          </div>

          {/* Серце — як на картці курсу. У макеті картки товару його немає
              (272:4465 і 326:2), додано на прохання замовника. */}
          <SaveButton target={{ product: product.id }} initialSaved={saved} authorized={authorized} />
        </div>

        {colors.length > 0 && (
          <div className="flex items-center gap-[5px] md:gap-1.5">
            {colors.slice(0, 3).map((color) => (
              <span
                key={color.id}
                title={color.title}
                className="h-2.5 w-2.5 rounded-full ring-1 ring-ink md:h-3.5 md:w-3.5 md:ring-flax"
                style={{ background: color.hex }}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
