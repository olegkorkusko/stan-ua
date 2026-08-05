'use client'

import { useRowLabel } from '@payloadcms/ui'

type LessonRow = { title?: string | null }

export const LessonRowLabel = () => {
  const { data, rowNumber } = useRowLabel<LessonRow>()
  const index = String((rowNumber ?? 0) + 1).padStart(2, '0')

  return <span>{`МК ${index}${data?.title ? ` · ${data.title}` : ''}`}</span>
}
