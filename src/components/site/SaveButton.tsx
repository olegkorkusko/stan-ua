'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useLocale } from '@/components/site/LocaleLink'
import { dictionary } from '@/lib/i18n'

/**
 * Обране — серце. Стоїть на картці курсу (макет I161:4202;148:4), на картці
 * товару та на сторінках курсу й товару.
 *
 * Два вигляди, і обидва описані тут, а не класами в місцях виклику:
 *
 *   plain — саме серце, без оправи. На картках, у рядку з назвою.
 *   boxed — квадрат 46×46 з рамкою, поруч із кнопкою купівлі (макет 148:3562).
 *
 * У boxed стан «збережено» показує не сама іконка, а вся кнопка: рамка
 * заливається, серце стає світлим. Без заливки різниця між «збережено» й ні
 * зводилась до тонкої лінії всередині іконки — її просто не видно.
 *
 * Це власна ціль кліку поверх посилання картки, тому тут z-10 і
 * stopPropagation: клік по серцю не має вести на сторінку товару чи курсу.
 *
 * Гостя ведемо в кабінет, а не ховаємо кнопку — інакше людина не дізнається,
 * що така можливість узагалі є.
 */
export const SaveButton = ({
  target,
  initialSaved,
  authorized,
  variant = 'plain',
  node,
}: {
  /** Що зберігаємо — рівно одне з двох. */
  target: { course: number } | { product: number }
  initialSaved: boolean
  authorized: boolean
  variant?: 'plain' | 'boxed'
  /** Ідентифікатор вузла Figma для екранів, які звіряються попіксельно. */
  node?: string
}) => {
  const router = useRouter()
  const t = dictionary(useLocale()).courses
  const [saved, setSaved] = useState(initialSaved)
  const [busy, setBusy] = useState(false)

  const toggle = async (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()

    if (!authorized) {
      router.push('/account')
      return
    }

    setBusy(true)
    // Малюємо новий стан одразу: мережа тут не має відчуватись.
    const next = !saved
    setSaved(next)
    try {
      const response = await fetch('/api/account/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          'course' in target ? { courseId: target.course } : { productId: target.product },
        ),
      })
      if (!response.ok) throw new Error('save failed')
      const data = (await response.json()) as { saved: boolean }
      setSaved(data.saved)
    } catch {
      setSaved(!next)
    } finally {
      setBusy(false)
    }
  }

  /*
    У спокої рамка й серце — світло-сірі, щоб кнопка читалась як «ще не
    натиснута». Колір заданий один раз через текст, а рамка бере його як
    border-current: так вони не можуть розʼїхатися, якщо колір колись правитимуть.

    У збереженому стані заливається вся кнопка, а серце стає паперовим.
  */
  const box =
    variant === 'boxed'
      ? `h-11.5 w-11.5 border ${
          saved
            ? 'border-ink bg-ink text-paper hover:bg-indigo hover:border-indigo active:opacity-80'
            : 'border-current text-ink/30 hover:text-ink/60 active:text-ink/80'
        }`
      : `-m-1.5 h-8 w-8 p-1.5 ${
          saved ? 'text-ink hover:text-ink/60 active:text-ink/40' : 'text-ink/30 hover:text-ink/60 active:text-ink/80'
        }`

  return (
    <button
      type="button"
      disabled={busy}
      aria-pressed={saved}
      aria-label={saved ? t.saved : t.save}
      onClick={toggle}
      data-figma-node={node}
      className={`relative z-10 flex shrink-0 items-center justify-center transition-colors disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 ${box}`}
    >
      {/* Контур і заливка — обидва currentColor, тож серце завжди того самого
          кольору, що й рамка: чорне на паперовому тлі, світле на залитому. */}
      <svg
        viewBox="0 0 14 12"
        aria-hidden="true"
        className="h-[15.2px] w-[17.1px] overflow-visible"
        fill={saved ? 'currentColor' : 'none'}
      >
        <path
          d="M7 11.2C7 11.2 1 7.9 1 4.1C1 2.4 2.3 1 4 1C5.2 1 6.4 1.7 7 2.8C7.6 1.7 8.8 1 10 1C11.7 1 13 2.4 13 4.1C13 7.9 7 11.2 7 11.2Z"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
