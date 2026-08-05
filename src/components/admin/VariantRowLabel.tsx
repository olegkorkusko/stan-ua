'use client'

import { useRowLabel } from '@payloadcms/ui'

type VariantRow = { sku?: string | null; stock?: number | null }

/** Згорнута варіація має читатись без розгортання: артикул і залишок. */
export const VariantRowLabel = () => {
  const { data, rowNumber } = useRowLabel<VariantRow>()
  const index = String((rowNumber ?? 0) + 1).padStart(2, '0')
  const stock = data?.stock ?? 0
  const name = data?.sku || `Варіація ${index}`

  return (
    <span>
      {name} · {stock > 0 ? `${stock} шт` : 'немає в наявності'}
    </span>
  )
}
