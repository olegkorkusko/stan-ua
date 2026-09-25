'use client'

import { useEffect, useState } from 'react'

/*
  Підказки міст і відділень Нової Пошти.

  Жили всередині форми оформлення й нікуди більше не діставались — через це в
  кабінеті, у «Даних для доставки», місто доводилось вбивати руками, без
  жодної підказки. Людина бачила на сайті дві різні поведінки в тому самому
  полі й не розуміла, яка з них правильна.

  Тому і хук, і саме поле лежать тут, а форма оформлення й кабінет лише
  користуються ними.
*/

export type Suggestion = { label: string; ref: string }

/**
 * Підказки адрес з невеликою затримкою, щоб не смикати API на кожну літеру.
 * `enabled` вимикає їх для Укрпошти: довідник Нової Пошти для неї не підходить.
 */
export const useSuggestions = (
  type: 'city' | 'branch',
  query: string,
  cityRef?: string,
  enabled = true,
) => {
  const [items, setItems] = useState<Suggestion[]>([])
  const [manual, setManual] = useState(false)

  /*
    Коли підказок бути не має — надто короткий запит, Укрпошта, ще не вибране
    місто — ми не гасимо стан усередині ефекту, а просто не віддаємо його
    назовні. Скидання стану прямо в ефекті тягне за собою зайвий каскад
    перемальовок, і лінтер на це справедливо свариться.
  */
  const active =
    enabled && (type === 'branch' ? Boolean(cityRef) : query.trim().length >= 2)

  useEffect(() => {
    if (!active) return

    const timer = setTimeout(async () => {
      const params = new URLSearchParams({ type, q: query })
      if (cityRef) params.set('ref', cityRef)
      try {
        const response = await fetch(`/api/nova-poshta?${params}`)
        const data = (await response.json()) as { items: Suggestion[]; manual?: boolean }
        setItems(data.items ?? [])
        setManual(Boolean(data.manual))
      } catch {
        setManual(true)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [type, query, cityRef, active])

  return { items: active ? items : [], manual }
}

/**
 * Поле з випадним списком підказок. Значення лишається в того, хто викликає:
 * у оформленні воно частина форми замовлення, у кабінеті — частина профілю.
 */
export const Suggest = ({
  value,
  onChange,
  onPick,
  items,
  placeholder,
  label,
  show,
}: {
  value: string
  onChange: (value: string) => void
  onPick: (item: Suggestion) => void
  items: Suggestion[]
  placeholder: string
  /** Для кабінету, де поля без видимих підписів. */
  label?: string
  show: boolean
}) => (
  <div className="relative">
    <input
      className="field"
      placeholder={placeholder}
      aria-label={label ?? placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
    {show && items.length > 0 && (
      <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto border border-flax bg-paper shadow-sm">
        {items.map((item) => (
          <li key={item.ref}>
            <button
              type="button"
              className="w-full px-3.5 py-2 text-left text-sm hover:bg-paper-deep"
              onClick={() => onPick(item)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
)
