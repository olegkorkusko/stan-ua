/**
 * Checkbox — програмний РРО. За законом фіскальний чек обовʼязковий при оплаті
 * карткою і за товари, і за курси. Сервіс оформлюється на ФОП клієнтки.
 *
 * Без ключів у .env інтеграція мовчки вимикається: сайт працює, чеки не йдуть.
 * Це свідомо — щоб відсутність РРО не блокувала прийом оплат на старті,
 * але про це має знати власниця.
 */
const API = process.env.CHECKBOX_API_URL || 'https://api.checkbox.in.ua/api/v1'

type Receipt = {
  orderNumber: string
  email: string
  items: { name: string; price: number; quantity: number }[]
  total: number
}

export const isConfigured = (): boolean =>
  Boolean(process.env.CHECKBOX_LOGIN && process.env.CHECKBOX_PASSWORD && process.env.CHECKBOX_LICENSE_KEY)

const signIn = async (): Promise<string | null> => {
  const response = await fetch(`${API}/cashier/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      login: process.env.CHECKBOX_LOGIN,
      password: process.env.CHECKBOX_PASSWORD,
    }),
  })
  if (!response.ok) return null
  const data = (await response.json()) as { access_token?: string }
  return data.access_token ?? null
}

const openShiftIfNeeded = async (token: string): Promise<void> => {
  await fetch(`${API}/shifts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'X-License-Key': process.env.CHECKBOX_LICENSE_KEY ?? '',
    },
  }).catch(() => undefined)
}

/** Копійки: Checkbox рахує суми в мінімальних одиницях. */
const toKopiyky = (value: number) => Math.round(value * 100)

export const createReceipt = async (receipt: Receipt): Promise<string | null> => {
  if (!isConfigured()) return null

  try {
    const token = await signIn()
    if (!token) {
      console.error('Checkbox: не вдалось авторизуватись')
      return null
    }

    await openShiftIfNeeded(token)

    const response = await fetch(`${API}/receipts/sell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-License-Key': process.env.CHECKBOX_LICENSE_KEY ?? '',
      },
      body: JSON.stringify({
        goods: receipt.items.map((item) => ({
          good: { code: item.name.slice(0, 32), name: item.name, price: toKopiyky(item.price) },
          quantity: item.quantity * 1000, // Checkbox рахує кількість у тисячних
        })),
        payments: [{ type: 'CASHLESS', value: toKopiyky(receipt.total) }],
        delivery: { email: receipt.email },
        header: receipt.orderNumber,
      }),
    })

    if (!response.ok) {
      console.error('Checkbox: чек не створено', await response.text())
      return null
    }

    const data = (await response.json()) as { id?: string }
    return data.id ?? null
  } catch (error) {
    console.error('Checkbox не відповів', error)
    return null
  }
}
