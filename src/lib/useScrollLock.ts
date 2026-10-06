'use client'

import { useEffect } from 'react'

/*
  Блокує прокручування сторінки, поки відкрита шухляда фільтрів, бічне меню
  або кошик.

  Разом із прокруткою зникає й смуга — і сторінка сіпається праворуч рівно на
  її ширину. Тому на час блокування ми компенсуємо цю ширину полем: скільки
  забрала смуга, стільки й додаємо.

  Раніше `scrollbar-gutter: stable` на html резервував місце ЗАВЖДИ — і на
  macOS, де смуга накладна й нічого не займає, сторінка просто ставала на
  4 px вужчою за макет. Компенсація діє лише коли є що компенсувати.

  Лічильник, а не «запамʼятати й повернути» в кожному шарі.

  Доти кожен шар зберігав той стан, який застав, і повертав його при
  закритті. Поки шар один — працює. Два шари, закриті у зворотному порядку,
  давали таке:

    відкрили меню    запамʼятали «порожньо», поставили hidden
    відкрили кошик   запамʼятали «hidden», поставили hidden
    закрили меню     повернули «порожньо» — прокрутка ожила під кошиком
    закрили кошик    повернули «hidden» — і воно лишилось назавжди

  Сторінка після цього не прокручувалась, а поле праворуч у 4 px лишалось
  висіти й ламало ширину. Лічильник прибирає сам порядок із рівняння: стан
  знімається один раз, коли закрився ОСТАННІЙ шар, і це завжди чистий стан,
  який був до першого блокування.
*/

let locks = 0
let saved: { overflow: string; paddingRight: string } | null = null

export const useScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return

    const element = document.documentElement

    if (locks === 0) {
      saved = { overflow: element.style.overflow, paddingRight: element.style.paddingRight }
      const scrollbar = window.innerWidth - element.clientWidth
      element.style.overflow = 'hidden'
      if (scrollbar > 0) element.style.paddingRight = `${scrollbar}px`
    }
    locks += 1

    return () => {
      locks -= 1
      if (locks > 0 || !saved) return
      element.style.overflow = saved.overflow
      element.style.paddingRight = saved.paddingRight
      saved = null
    }
  }, [locked])
}
