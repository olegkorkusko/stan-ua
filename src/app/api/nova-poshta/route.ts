import { NextResponse } from 'next/server'

const API = 'https://api.novaposhta.ua/v2.0/json/'

type NpResponse = { success: boolean; data: unknown[] }

const call = async (modelName: string, calledMethod: string, methodProperties: Record<string, unknown>) => {
  const response = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: process.env.NOVA_POSHTA_API_KEY, modelName, calledMethod, methodProperties }),
    cache: 'no-store',
  })
  return (await response.json()) as NpResponse
}

/**
 * Підказки міст і відділень Нової Пошти. Без ключа повертаємо порожній список —
 * форма тоді дає ввести адресу вручну, а не ламається.
 */
export const GET = async (request: Request) => {
  if (!process.env.NOVA_POSHTA_API_KEY) return NextResponse.json({ items: [], manual: true })

  const url = new URL(request.url)
  const type = url.searchParams.get('type')
  const query = (url.searchParams.get('q') ?? '').trim()
  const cityRef = url.searchParams.get('ref') ?? ''

  try {
    if (type === 'city') {
      if (query.length < 2) return NextResponse.json({ items: [] })
      const result = await call('AddressGeneral', 'searchSettlements', { CityName: query, Limit: 8 })
      const addresses = (result.data?.[0] as { Addresses?: { Present: string; DeliveryCity: string }[] })?.Addresses ?? []
      return NextResponse.json({
        items: addresses.map((item) => ({ label: item.Present, ref: item.DeliveryCity })),
      })
    }

    if (type === 'branch') {
      if (!cityRef) return NextResponse.json({ items: [] })
      const result = await call('AddressGeneral', 'getWarehouses', {
        SettlementRef: cityRef,
        FindByString: query,
        Limit: 20,
      })
      const warehouses = (result.data ?? []) as { Description: string; Ref: string }[]
      return NextResponse.json({
        items: warehouses.map((item) => ({ label: item.Description, ref: item.Ref })),
      })
    }

    return NextResponse.json({ items: [] })
  } catch (error) {
    console.error('Нова Пошта не відповіла', error)
    return NextResponse.json({ items: [], manual: true })
  }
}
