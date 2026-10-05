'use client'

import { useEffect, useRef } from 'react'

/*
  Ролик, що оживає при наведенні на картку товару.

  Чому тут JS, а не самий CSS: показати відео можна й класом, а от запустити
  його — ні. `<video autoplay>` грав би в усіх картках одразу, тобто двадцять
  роликів на екран каталогу.

  Слухачі вішаються на саму картку, а не на відео. Навести можна будь-куди —
  на назву, на ціну, — і зображення під нею вже наближається (group-hover).
  Якби ролик реагував лише на власний прямокутник, виходило б дві різні
  зони наведення в одній картці.

  preload="none" — обовʼязково. Інакше браузер тягне метадані кожного ролика
  в сітці ще до того, як на них хтось навів. Ціна рішення — чверть секунди
  затримки на першому наведенні.

  Поважаємо «зменшити рух»: кому воно ввімкнене, той бачить фото.
*/
export const CardVideo = ({ src, className = '' }: { src: string; className?: string }) => {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = ref.current
    /*
      Картка товару — <article>, картка категорії й напряму — <a>: там уся
      плитка і є посиланням. Беремо найближчого з обох, бо наведення має
      ловитися на всю картку, а не на сам ролик.
    */
    const card = video?.closest('article, a')
    if (!video || !card) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const play = () => {
      video.currentTime = 0
      // Обірветься, якщо навели й одразу пішли, — це не помилка.
      void video.play().catch(() => undefined)
    }
    const stop = () => {
      video.pause()
      video.currentTime = 0
    }

    // focusin/focusout — для тих, хто ходить каталогом із клавіатури.
    card.addEventListener('pointerenter', play)
    card.addEventListener('pointerleave', stop)
    card.addEventListener('focusin', play)
    card.addEventListener('focusout', stop)

    return () => {
      card.removeEventListener('pointerenter', play)
      card.removeEventListener('pointerleave', stop)
      card.removeEventListener('focusin', play)
      card.removeEventListener('focusout', stop)
    }
  }, [])

  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:hidden ${className}`}
    />
  )
}
