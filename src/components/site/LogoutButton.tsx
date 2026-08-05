'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export const LogoutButton = () => {
  const router = useRouter()
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
      {busy ? 'Виходимо…' : 'Вийти'}
    </button>
  )
}
