'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { track } from '@/components/site/Analytics'

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
  /** Поки кошик не приїхав із сервера, показуємо стан завантаження. */
  ready: boolean
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  remove: (key: string) => void
  setQuantity: (key: string, quantity: number) => void
  clear: () => void
  open: () => void
  close: () => void
}

const Context = createContext<CartContext | null>(null)
const STORAGE_KEY = 'mk.cart.v1'

/** Серверу вистачає ідентифікаторів: назви й ціни він підставляє сам. */
const toLines = (items: CartItem[]) =>
  items.map((item) => ({
    kind: item.kind,
    itemId: item.id,
    variantId: item.variantId,
    quantity: item.quantity,
  }))

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [ready, setReady] = useState(false)
  const skipNextSave = useRef(true)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Крок 1: миттєво малюємо те, що лишилось у браузері.
  // Крок 2: питаємо сервер — він знає про інші пристрої й свіжі ціни.
  useEffect(() => {
    let cancelled = false

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setItems(JSON.parse(raw) as CartItem[])
    } catch {
      // зіпсоване сховище не має ламати сайт
    }

    const sync = async () => {
      try {
        const response = await fetch('/api/cart', { cache: 'no-store' })
        if (!response.ok) return
        const data = (await response.json()) as { items: CartItem[] }
        if (cancelled) return

        const local = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]') as CartItem[]

        if (data.items.length === 0 && local.length > 0) {
          // На сервері порожньо — віддаємо йому те, що набрали до входу.
          const push = await fetch('/api/cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: toLines(local) }),
          })
          if (push.ok) {
            const pushed = (await push.json()) as { items: CartItem[] }
            if (!cancelled) setItems(pushed.items)
          }
        } else {
          setItems(data.items)
        }
      } catch {
        // Немає звʼязку — лишаємось на локальному кошику.
      } finally {
        if (!cancelled) {
          skipNextSave.current = true
          setReady(true)
        }
      }
    }

    void sync()
    return () => {
      cancelled = true
    }
  }, [])

  // Зміни зберігаються локально одразу, на сервер — із затримкою,
  // щоб натискання «+» п'ять разів поспіль не давало п'ять запитів.
  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))

    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      void fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: toLines(items) }),
      }).catch(() => undefined)
    }, 600)

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [items])

  const add: CartContext['add'] = useCallback((item, quantity = 1) => {
    track('add_to_cart', {
      currency: 'UAH',
      value: item.price * quantity,
      items: [{ item_id: item.id, item_name: item.title, price: item.price, quantity }],
    })

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
      ready,
      add,
      remove,
      setQuantity,
      clear: () => setItems([]),
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    }),
    [items, isOpen, ready, add, remove, setQuantity],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export const useCart = () => {
  const context = useContext(Context)
  if (!context) throw new Error('useCart має викликатись усередині CartProvider')
  return context
}
