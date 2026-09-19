'use client'

import { useEffect } from 'react'

/**
 * Блокує прокручування сторінки, поки відкрита шухляда фільтрів, бічне меню
 * або кошик.
 *
 * Разом із прокруткою зникає й смуга — і сторінка сіпається праворуч рівно на
 * її ширину. Тому на час блокування ми компенсуємо цю ширину полем: скільки
 * забрала смуга, стільки й додаємо.
 *
 * Раніше цю роль грав `scrollbar-gutter: stable` на html, але він резервував
 * місце ЗАВЖДИ — і на macOS, де смуга накладна й нічого не займає, сторінка
 * просто ставала на 4px вужчою за макет. Компенсація діє лише коли є що
 * компенсувати: на накладних смугах різниця нульова й поле не додається.
 *
 * Попереднє значення запам'ятовуємо й повертаємо: два відкриті шари одночасно
 * (кошик поверх меню) не мають розблоковувати сторінку, коли закриється лише
 * верхній.
 */
export const useScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked) return

    const element = document.documentElement
    const previousOverflow = element.style.overflow
    const previousPadding = element.style.paddingRight
    const scrollbar = window.innerWidth - element.clientWidth

    element.style.overflow = 'hidden'
    if (scrollbar > 0) element.style.paddingRight = `${scrollbar}px`

    return () => {
      element.style.overflow = previousOverflow
      element.style.paddingRight = previousPadding
    }
  }, [locked])
}
