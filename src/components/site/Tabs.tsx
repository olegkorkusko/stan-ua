'use client'

import { LocaleLink as Link } from '@/components/site/LocaleLink'
import { cn } from '@/lib/utils'

export type TabItem = {
  key: string
  title: string
  /**
   * Куди веде вкладка. Є посилання — вкладка стає маршрутом (кабінет);
   * немає — звичайною кнопкою, що перемикає стан на місці (форма входу).
   */
  href?: string
  /** Ідентифікатор вузла Figma — екрани кабінету звіряються попіксельно. */
  node?: string
}

type Props = {
  items: TabItem[]
  /** Ключ активної вкладки. */
  active: string
  /** Для вкладок-кнопок: що робити при натисканні. */
  onSelect?: (key: string) => void
  /** Ліворуч — у кабінеті, по центру — на екрані входу. */
  align?: 'left' | 'center'
  /** Підпис для читачів екрана: рядок вкладок — це навігація. */
  label: string
  node?: string
  className?: string
}

/*
  Рядок вкладок. Один на екран входу («Посилання · Пароль · Реєстрація») і на
  кабінет («Мої доступи · Збережені курси · Дані для доставки»).

  Вигляд — той, що був на екрані входу: звичайний регістр, 14px, активна
  підкреслена лінією знизу. Кабінет раніше мав інший, за макетом 138:3089:
  верхній регістр 11px із розрядкою. За рішенням замовника обидва місця
  зведено до цього, світлішого варіанта.

  Наслідок, про який варто пам'ятати: вкладки кабінету тепер відрізняються
  від намальованих у макеті, тож попіксельне звіряння цих трьох кадрів на них
  свариться. Атрибути `data-figma-node` лишені навмисно — щоб було видно, з
  чим саме розбіжність, а не щоб її сховати.

  Активна вкладка не клікабельна: посилання вело б на вже відкриту сторінку,
  кнопка — перемикала б на вже вибраний стан.
*/
const ITEM = '-mb-px border-b pb-3 text-sm transition-colors'
const ACTIVE = 'border-ink text-ink'
const REST = 'border-transparent text-muted hover:text-ink'

export const Tabs = ({
  items,
  active,
  onSelect,
  align = 'left',
  label,
  node,
  className,
}: Props) => (
  <nav
    data-figma-node={node}
    aria-label={label}
    className={cn(
      'flex flex-wrap gap-x-6 gap-y-2 border-b border-flax',
      align === 'center' && 'justify-center',
      className,
    )}
  >
    {items.map((item) => {
      const current = item.key === active

      if (current) {
        return (
          <span
            key={item.key}
            aria-current="page"
            data-figma-node={item.node}
            className={cn(ITEM, ACTIVE)}
          >
            {item.title}
          </span>
        )
      }

      return item.href ? (
        <Link
          key={item.key}
          href={item.href}
          data-figma-node={item.node}
          className={cn(ITEM, REST)}
        >
          {item.title}
        </Link>
      ) : (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect?.(item.key)}
          data-figma-node={item.node}
          className={cn(ITEM, REST)}
        >
          {item.title}
        </button>
      )
    })}
  </nav>
)
