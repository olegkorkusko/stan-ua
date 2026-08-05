'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type CartItem = {
  /** Унікальний ключ позиції: товар + варіація, або курс. */
  key: string
  kind: 'product' | 'course'
  id: string
  variantId?: string
  title: string
  variantLabel?: string
  price: number
  quantity: number
  image?: string
  href: string
  /** Скільки лишилось на складі — щоб не дати замовити більше, ніж є. */
  maxQuantity?: number
}

type CartContext = {
  items: CartItem[]
  count: number
  total: number
  isOpen: boolean
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  remove: (key: string) => void
  setQuantity: (key: string, quantity: number) => void
  clear: () => void
  open: () => void
  close: () => void
}

const Context = createContext<CartContext | null>(null)
const STORAGE_KEY = 'mk.cart.v1'

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw) as CartItem[])
    } catch {
      // зіпсоване сховище не має ламати сайт
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, hydrated])

  const add: CartContext['add'] = useCallback((item, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((i) => i.key === item.key)
      if (!existing) return [...current, { ...item, quantity }]
      // Курс не має сенсу купувати двічі.
      if (item.kind === 'course') return current
      const limit = item.maxQuantity ?? Infinity
      return current.map((i) =>
        i.key === item.key ? { ...i, quantity: Math.min(i.quantity + quantity, limit) } : i,
      )
    })
    setIsOpen(true)
  }, [])

  const remove: CartContext['remove'] = useCallback((key) => {
    setItems((current) => current.filter((i) => i.key !== key))
  }, [])

  const setQuantity: CartContext['setQuantity'] = useCallback((key, quantity) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((i) => i.key !== key)
        : current.map((i) =>
            i.key === key ? { ...i, quantity: Math.min(quantity, i.maxQuantity ?? Infinity) } : i,
          ),
    )
  }, [])

  const value = useMemo<CartContext>(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      isOpen,
      add,
      remove,
      setQuantity,
      clear: () => setItems([]),
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [items, isOpen, add, remove, setQuantity],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useCart = () => {
  const context = useContext(Context)
  if (!context) throw new Error('useCart має викликатись усередині CartProvider')
  return context
}
