import { X } from 'lucide-react'
import type { Ref } from 'react'

import { cn } from '@/lib/utils'

type Props = {
  onClick: () => void
  label: string
  /** Вузол макета на самій іконці, якщо він у неї є. */
  node?: string
  className?: string
  /** Потрібен мобільному меню: після закриття фокус повертається на бургер. */
  ref?: Ref<HTMLButtonElement>
}

/*
  Хрестик «закрити» — один на всі шухляди й на мобільне меню.

  Був у чотирьох місцях і скрізь інший: у підсумку кошика 12 px, у фільтрах
  16, а в меню взагалі інша іконка на 28. Виглядало як недогляд, бо ним і
  було — кожну шухляду верстали окремо.

  За зразок узято меню: strokeWidth 1.2 при size-7 дає рівно 14×14 з
  обведенням 1.4 — так намальовано в макеті (302:4427). Інші місця мали
  власні числа, але жодне з них не було ближчим до дизайну.

  Зона натискання 40 px від'ємним полем: сама іконка лишається намальованого
  розміру, а влучити пальцем у 14 px неможливо (WCAG 2.5.8 просить від 24).
*/
export const CloseButton = ({ onClick, label, node, className, ref }: Props) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    aria-label={label}
    className={cn(
      '-m-3.5 p-3.5 text-ink transition-opacity hover:opacity-60 active:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2',
      className,
    )}
  >
    <span data-figma-node={node} className="flex size-5 items-center justify-center">
      <X strokeWidth={1.2} className="size-7" aria-hidden="true" />
    </span>
  </button>
)
