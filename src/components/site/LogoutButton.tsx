'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useLocale } from '@/components/site/LocaleLink'
import { dictionary } from '@/lib/i18n'

export const LogoutButton = () => {
  const router = useRouter()
  const t = dictionary(useLocale()).account
  const [busy, setBusy] = useState(false)

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        await fetch('/api/customers/logout', { method: 'POST' })
        router.refresh()
      }}
      className="thread-link text-sm text-muted"
    >
      {busy ? '…' : t.logout}
    </button>
  )
}
