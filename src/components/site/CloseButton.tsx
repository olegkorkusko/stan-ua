import { cn } from '@/lib/utils'

type Props = {
  onClick: () => void
  label: string
  /** Вузол макета, якщо в цього хрестика він є. */
  node?: string
  className?: string
}

/*
  Хрестик «закрити» для шухляд.

  Був у чотирьох місцях і скрізь різний: 12, 14 і 16 px, а в мобільному меню
  взагалі інша іконка на 28. Виглядало як недогляд, бо ним і було — кожну
  шухляду верстали окремо.

  Розмір 16: найбільший із трьох дрібних, і саме він уже стояв у двох місцях
  із трьох. Мобільне меню лишилось на своїй іконці — там це не дрібний
  хрестик у куті картки, а головна кнопка повноекранного аркуша.

  Відступи від'ємним полем: сама іконка лишається 16 px, як у макеті, але
  натискається область 32 — на телефоні в 16 px не влучити.
*/
export const CloseButton = ({ onClick, label, node, className }: Props) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    data-figma-node={node}
    className={cn(
      '-m-2 p-2 text-ink transition-opacity hover:opacity-60 active:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2',
      className,
    )}
  >
    <svg viewBox="0 0 12 12" className="size-4" fill="none" aria-hidden="true">
      <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  </button>
)
