'use client'

import { Bookmark } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLocale } from '@/components/site/LocaleLink'
import { dictionary } from '@/lib/i18n'

/**
 * Обране. Для незалогінених ведемо в кабінет, а не ховаємо кнопку:
 * інакше людина не дізнається, що така можливість узагалі є.
 */
export const SaveCourse = ({
  courseId,
  initialSaved,
  authorized,
}: {
  courseId: number
  initialSaved: boolean
  authorized: boolean
}) => {
  const router = useRouter()
  const t = dictionary(useLocale()).courses
  const [saved, setSaved] = useState(initialSaved)
  const [busy, setBusy] = useState(false)

  return (
    <button
      type="button"
      disabled={busy}
      aria-pressed={saved}
      onClick={async () => {
        if (!authorized) {
          router.push('/account')
          return
        }
        setBusy(true)
        try {
          const response = await fetch('/api/account/saved', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId }),
          })
          if (response.ok) {
            const data = (await response.json()) as { saved: boolean }
            setSaved(data.saved)
          }
        } finally {
          setBusy(false)
        }
      }}
      className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-xs text-muted transition-colors hover:text-ink"
    >
      <Bookmark size={14} strokeWidth={1.5} fill={saved ? 'currentColor' : 'none'} />
      {saved ? t.saved : t.save}
    </button>
  )
}
