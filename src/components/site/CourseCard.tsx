import Image from 'next/image'
import { LocaleLink as Link } from '@/components/site/LocaleLink'

import { SaveButton } from '@/components/site/SaveButton'
import { formatPrice, plural } from '@/lib/format'
import { imageAlt, imageUrl } from '@/lib/media'
import type { Course } from '@/payload-types'

/*
  Картка курсу за макетом (компонент-сет 272:4478, варіанти «Спокій» 12:11 і
  «Наведення» 272:4466). Один і той самий компонент стоїть у каталозі,
  на сторінках напрямів, у журналі й у пошуку — різниться лише ширина.

  Ключове, чого тут раніше не було: у картки є ВЛАСНА заливка #F4F4F4 і
  падінги 16 у текстовому блоці. Без них це не картка, а колонка тексту
  під фото — саме так воно й виглядало.

  Висота обкладинки ФІКСОВАНА 294 px на всіх ширинах: 322×294 у кабінеті,
  358×294 на мобільному, 437×294 на сторінці напряму, 469×294 у каталозі.
  Тому тут саме висота, а не пропорція: за пропорцією фото росло б разом
  із колонкою й у жодну з цих ширин не влучало.

  Текстових полів у компонента рівно чотири: назва, підпис, ціна, обсяг,
  плюс серце «Обране» праворуч від назви. Ні бейджа «Акція», ні закресленої
  старої ціни в макеті немає — стара ціна живе тільки на сторінці курсу.

  Клік: у макеті вся картка веде на курс (161:4202), а серце має власну дію.
  Тому посилання тут «розтягнуте» псевдоелементом на всю картку, а не обгортає
  її: кнопка всередині посилання була б і невалідним HTML, і пасткою для
  клавіатури.
*/
/*
  Ідентифікатори всередині примірника компонента Figma будуються за схемою
  `I<примірник>;<вузол компонента>`, тож увесь набір виводиться з кореня —
  переписувати десяток рядків на кожну картку не треба.
*/
export type CourseCardNodes = ReturnType<typeof courseCardNodes>

export const courseCardNodes = (root: string) => ({
  root,
  frame: `I${root};272:4419`,
  cover: `I${root};12:12`,
  body: `I${root};162:3`,
  titleRow: `I${root};148:3520`,
  title: `I${root};12:13`,
  save: `I${root};148:4`,
  tagline: `I${root};12:14`,
  priceRow: `I${root};12:15`,
  price: `I${root};12:16`,
  lessons: `I${root};12:17`,
})

export const CourseCard = ({
  course,
  directionSlug,
  saved = false,
  authorized = false,
  nodes,
}: {
  course: Course
  directionSlug: string
  saved?: boolean
  authorized?: boolean
  /** Ідентифікатори вузлів Figma для екранів, які звіряються попіксельно. */
  nodes?: CourseCardNodes
}) => {
  const cover = imageUrl(course.cover, 'card')
  const lessons = course.lessons?.length ?? 0
  const lessonsLabel = lessons > 0 ? plural(lessons, 'МК', 'МК', 'МК') : null

  return (
    <article data-figma-node={nodes?.root} className="group relative flex flex-col gap-4 bg-[#F4F4F4]">
      <div data-figma-node={nodes?.frame} className="relative h-[294px] overflow-hidden bg-paper-deep">
        {cover ? (
          <Image
            src={cover}
            alt={imageAlt(course.cover, course.title)}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            data-figma-node={nodes?.cover}
            className="object-cover transition-transform duration-[220ms] ease-out group-hover:scale-[1.07] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div data-figma-node={nodes?.cover} className="weave h-full w-full" />
        )}
      </div>

      {/* flex-1 + mt-auto нижче: підписи в курсів різної довжини, і без цього
          ціна в сусідніх картках ряду стоїть на різній висоті. У макеті всі
          підписи однорядкові, тож там питання не виникало. */}
      <div data-figma-node={nodes?.body} className="flex flex-1 flex-col gap-4 px-4 pb-4">
        <div data-figma-node={nodes?.titleRow} className="flex items-center gap-3.5">
          <h3 data-figma-node={nodes?.title} className="min-w-0 flex-1 font-display text-[17px] font-normal leading-[21.76px] tracking-[-0.005em] text-ink">
            <Link
              href={`/courses/${directionSlug}/${course.slug}`}
              data-interaction-exempt="на наведення реагує вся картка — фото під нею наближається (варіант «Наведення» 272:4466); саме посилання розтягнуте поверх картки й не має власного вигляду"
              className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {course.title}
            </Link>
          </h3>
          <SaveButton
            target={{ course: course.id }}
            initialSaved={saved}
            authorized={authorized}
            node={nodes?.save}
          />
        </div>

        {course.tagline && (
          <p
            data-figma-node={nodes?.tagline}
            className="text-[13px] font-normal leading-5 text-muted"
          >
            {course.tagline}
          </p>
        )}

        <div data-figma-node={nodes?.priceRow} className="mt-auto flex items-center gap-3">
          {/* Ціна — Unbounded Regular 400: так у майстер-компоненті (12:16) і в
              усіх його примірниках, від каталогу до кабінету. */}
          <span
            data-figma-node={nodes?.price}
            className="font-display text-[13px] font-normal leading-[17px] text-ink"
          >
            {formatPrice(course.price)}
          </span>
          {lessonsLabel && (
            <span
              data-figma-node={nodes?.lessons}
              className="ml-auto text-right text-[13px] font-normal leading-5 text-muted"
            >
              {lessonsLabel}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
