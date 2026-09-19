import type { ElementType, ReactNode } from 'react'

import { cn } from '@/lib/utils'

/*
  Два написи, що повторюються майже на кожному екрані: дрібний підпис над
  заголовком («МАГАЗИН», «ВІДГУКИ», «КУРСИ») і сам заголовок секції.

  До цього вони жили копіями — і встигли розійтися. Підпис існував у двох
  виглядах одночасно: 34 рази як клас `.label` і ще 17 разів сирими класами
  `text-[11px] … leading-[15.4px]`. Різниця саме в інтерліньяжі: у `.label`
  його не було взагалі, тож той самий напис на сусідніх сторінках мав різну
  висоту рядка. Заголовок 22→27 був скопійований дванадцять разів.

  Кеглі беруться з токенів `--text-eyebrow` і `--text-title` — там же й clamp,
  який плавно веде розмір від мобільного до десктопного.
*/

type Props = {
  children: ReactNode
  className?: string
  /** Тег під потребу сторінки: h1 на власному екрані, h2 всередині сторінки. */
  as?: ElementType
  /** Ідентифікатор вузла Figma — екрани звіряються з макетом попіксельно. */
  'data-figma-node'?: string
}

/** Підпис над заголовком. У макеті — Manrope 600 11/15.4, розрядка 0.16em. */
export const SectionLabel = ({ children, className, as: Tag = 'p', ...rest }: Props) => (
  <Tag className={cn('text-eyebrow uppercase text-muted', className)} {...rest}>
    {children}
  </Tag>
)

/** Заголовок секції. Unbounded 400, 22 на мобільному → 27 на десктопі. */
export const SectionTitle = ({ children, className, as: Tag = 'h2', ...rest }: Props) => (
  <Tag className={cn('font-display text-title font-normal text-ink', className)} {...rest}>
    {children}
  </Tag>
)
