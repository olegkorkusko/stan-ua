'use client'

import { useEffect, type ReactNode } from 'react'

import { useScrollLock } from '@/lib/useScrollLock'

type Props = {
  open: boolean
  onClose: () => void
  /** Заголовок угорі панелі. */
  title: string
  /** Підпис для кнопки закриття — потрібен читачам екрана. */
  closeLabel: string
  /** Нижній «поверх» панелі: кнопка застосування чи надсилання. */
  footer?: ReactNode
  children: ReactNode
}

/*
  Бічна панель — спільна для шухляди фільтрів і форми відгуку.

  Геометрія з макета «Фільтри» 131:2744: панель 400 біля ЛІВОГО краю поверх
  затемнення #0D0D0A 50%, падінги 32/28/24/28, заголовок Unbounded 17/21.8.
  На мобільному панель на весь екран і без затемнення.

  Винесено в окремий компонент навмисно: користувач просив, щоб форма відгуку
  відкривалась «як фільтри». Двома копіями вони розʼїхалися б за пару тижнів —
  а в проєкті вже є третя схожа панель у кошику й четверта в меню шапки.
*/
export const SideDrawer = ({ open, onClose, title, closeLabel, footer, children }: Props) => {
  useScrollLock(open)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    /*
      `inert` прибирає вміст закритої панелі з таб-порядку й з дерева
      доступності. Без нього aria-hidden лишає всередині фокусовані посилання
      та кнопки — це порушення правила aria-hidden-focus.
    */
    <div
      className={`fixed inset-0 z-70 ${open ? '' : 'pointer-events-none'}`}
      aria-hidden={!open}
      inert={!open}
    >
      {/* Затемнення лише з md: на мобільному панель і так на весь екран. */}
      <button
        type="button"
        tabIndex={-1}
        aria-label={closeLabel}
        onClick={onClose}
        className={`absolute inset-0 hidden bg-[#0D0D0A]/50 transition-opacity duration-300 md:block ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        className={`absolute inset-y-0 left-0 flex w-full flex-col justify-between bg-paper px-4 pb-6 pt-8 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] md:w-[400px] md:px-7 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex min-h-0 flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <p className="font-display text-[17px] leading-[21.76px] tracking-[-0.005em] text-ink">
              {title}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="text-ink transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              <svg viewBox="0 0 12 12" className="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M1 1L11 11M11 1L1 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </div>

        {footer}
      </div>
    </div>
  )
}
