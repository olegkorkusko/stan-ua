import type { ReactNode } from 'react'

import { LocaleLink as Link } from '@/components/site/LocaleLink'

type Props = {
  href: string
  /*
    Вузли макета приходять пропами: кнопка спільна, а кадри різні. Зашити їх
    усередину означало б, що обидві сторінки звіряються з одним і тим самим
    вузлом, а друга — мовчки ні з чим.
  */
  node: string
  labelNode: string
  children: ReactNode
}

/*
  Кнопка в герої на темному фото — «Магазин» (98:2169) і «Курси» (100:2182).

  У макеті це один компонент (10:12) з однаковими токенами: заливки немає,
  обведення біле 1px, радіус 2, поля 32/15. У коді вони жили двома копіями
  довгого className у двох файлах — і встигли розійтися: курсам хтось дописав
  суцільну заливку, якої в дизайні немає. Рівно те, від чого застерігає
  AGENTS.md: друга копія завжди починає жити власним життям.

  Не через `.btn` із globals.css: там кегль 12px і чорнильне обведення, тут
  10px і біле. Зводити їх силоміць — міняти геометрію, якої я не звіряв.
*/
export const HeroCta = ({ href, node, labelNode, children }: Props) => (
  <Link
    href={href}
    data-figma-node={node}
    className="inline-flex items-center justify-center rounded-[2px] border border-white px-8 py-[15px] text-[10px] font-semibold uppercase leading-[12px] tracking-[0.16em] text-paper transition-colors hover:bg-paper hover:text-ink"
  >
    <span data-figma-node={labelNode}>{children}</span>
  </Link>
)
