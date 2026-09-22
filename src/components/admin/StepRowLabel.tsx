'use client'

import { useRowLabel } from '@payloadcms/ui'

type StepRow = { number?: string | null; title?: string | null }

/**
 * Підпис згорнутого кроку в адмінці. Без нього три кроки виглядають як
 * «Крок 01 / Крок 02 / Крок 03» — і щоб знайти потрібний, доводиться
 * розкривати всі по черзі.
 */
export const StepRowLabel = () => {
  const { data, rowNumber } = useRowLabel<StepRow>()
  const number = data?.number || String((rowNumber ?? 0) + 1).padStart(2, '0')

  return <span>{`${number}${data?.title ? ` · ${data.title}` : ''}`}</span>
}
