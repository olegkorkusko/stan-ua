'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/*
  Кнопка «показати пароль» на вході в адмінку.

  Поле пароля Payload малює сам, і вставити щось усередину нього з конфіга не
  можна — дозволено лише додати компонент до або після форми. Тому шукаємо
  інпут на сторінці й портуємо кнопку в його обгортку: так вона стоїть там,
  де й має, а не окремим блоком над формою.

  Тип інпута міняємо напряму, а не через React: полем володіє Payload, і
  сперечатися з ним за значення не варто.
*/
export const PasswordPeek = () => {
  const input = useRef<HTMLInputElement | null>(null)
  const [host, setHost] = useState<HTMLElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const found = document.querySelector<HTMLInputElement>('form input[type="password"]')
    if (!found) return

    input.current = found
    // Щоб кнопка не лягла на текст, коли пароль довгий.
    found.style.paddingInlineEnd = '2.75rem'

    const wrapper = found.parentElement
    if (!wrapper) return
    if (getComputedStyle(wrapper).position === 'static') wrapper.style.position = 'relative'
    setHost(wrapper)
  }, [])

  useEffect(() => {
    if (input.current) input.current.type = shown ? 'text' : 'password'
  }, [shown])

  if (!host) return null

  return createPortal(
    <button
      type="button"
      onClick={() => setShown((value) => !value)}
      aria-label={shown ? 'Сховати пароль' : 'Показати пароль'}
      title={shown ? 'Сховати пароль' : 'Показати пароль'}
      style={{
        position: 'absolute',
        insetInlineEnd: '0.25rem',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '2.25rem',
        height: '2.25rem',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: 'currentColor',
        opacity: 0.55,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
        {shown && <path d="m4 4 16 16" />}
      </svg>
    </button>,
    host,
  )
}
