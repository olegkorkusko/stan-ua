import type { ReactNode } from 'react'

import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { cn } from '@/lib/utils'

type Props = {
  href: string
  /*
    Вузли макета приходять пропами: кнопка спільна, а кадри різні. Зашити їх
    усередину означало б, що обидві сторінки звіряються з одним і тим самим
    вузлом, а друга — мовчки ні з чим.
  */
  node: string
  labelNode: string
  /** Суцільна заливка кольору чорнила — як у героя курсів (100:2182). */
  filled?: boolean
  children: ReactNode
}

/*
  Кнопка в герої на темному фото — «Магазин» (98:2169) і «Курси» (100:2182).

  Спільне в них усе, крім заливки: біле обведення 1px, радіус 2, поля 32/15,
  кегль 10, і наведення, що вивертає кольори. У коді це жило двома копіями
  довгого className у двох файлах — виправиш одну, друга лишиться старою.

  Заливка — єдина справжня відмінність, тому вона й стала єдиним пропом.

  Не через `.btn` із globals.css: там кегль 12px і чорнильне обведення, тут
  10px і біле. Зводити їх силоміць — міняти геометрію, якої я не звіряв.
*/
export const HeroCta = ({ href, node, labelNode, filled, children }: Props) => (
  <Link
    href={href}
    data-figma-node={node}
    className={cn(
      'inline-flex items-center justify-center rounded-[2px] border border-white px-8 py-[15px] text-[10px] font-semibold uppercase leading-[12px] tracking-[0.16em] text-paper transition-colors hover:bg-paper hover:text-ink',
      filled && 'bg-ink',
    )}
  >
    <span data-figma-node={labelNode}>{children}</span>
  </Link>
)
