'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

/*
  Обраний колір товару — спільний для двох сусідів.

  Свотчі живуть у правій колонці (ProductPurchase), слайдер — у лівій
  (MediaGallery). Поки колір міняв лише ціну й залишок, він міг лишатися
  всередині свотчів. Тепер від нього залежить ще й те, які фото показує
  слайдер, а це вже інший компонент — і стан мусить стояти над обома.

  Контекст, а не підняття стану в спільного батька: батько тут — серверна
  сторінка товару з усією її розміткою, і перетворювати її на клієнтську
  заради одного рядка було б дорого.

  Значення за замовчуванням навмисно робоче, а не null: той самий слайдер
  стоїть на сторінці курсу, де жодних кольорів немає й провайдера теж.
*/
type Context = {
  colorId?: string
  setColorId: (id?: string) => void
}

const Ctx = createContext<Context | null>(null)

export const ProductColorProvider = ({
  initial,
  children,
}: {
  /** Колір першої варіації — той самий, що свотчі підсвічують на вході. */
  initial?: string
  children: ReactNode
}) => {
  const [colorId, setColorId] = useState(initial)
  const value = useMemo(() => ({ colorId, setColorId }), [colorId])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useProductColor = (): Context =>
  useContext(Ctx) ?? { colorId: undefined, setColorId: () => undefined }
