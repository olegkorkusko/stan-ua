import config from '@payload-config'
import { headers as requestHeaders } from 'next/headers'
import { getPayload } from 'payload'

import { sourceLabel } from '@/lib/source-label'

/*
  Сторінка «Звідки замовлення» в адмінці: /admin/statistics.

  Рахує не візити, а гроші. Візити вже рахують Google Analytics і піксель
  Meta, і обидва показують менше, ніж є: вони вмикаються після згоди на
  cookie, а згоду дає меншість, та ще й блокувальники ріжуть їхні скрипти.
  Тут джерело взяте з самого замовлення, записане на сервері, — тому
  рахуються всі до одного.

  Без бібліотек: «графік» це смужка шириною у відсотках від найбільшого
  рядка. Тягнути заради цього chart.js в адмінку було б дорожче за користь.
*/

const PERIODS = [
  { days: 7, label: '7 днів' },
  { days: 30, label: '30 днів' },
  { days: 90, label: '90 днів' },
  { days: 0, label: 'за весь час' },
]

/*
  Межа періоду окремою асинхронною функцією, а не рядком у рендері.

  Правило react-hooks забороняє кликати Date.now() під час рендеру: воно
  повертає щоразу інше, а компілятор React має право вважати рендер чистим і
  переграти його. У серверному компоненті наслідків немає, але помилка в
  лінті справжня, і те саме я вже ловив на сторінці подяки.
*/
const startOfPeriod = async (days: number) =>
  days > 0 ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString() : null

const money = (value: number) => `${Math.round(value).toLocaleString('uk-UA')} ₴`

export const OrderSources = async ({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) => {
  const params = (await searchParams) ?? {}
  const asked = Number(Array.isArray(params.days) ? params.days[0] : params.days)
  const days = PERIODS.some((p) => p.days === asked) ? asked : 30

  const payload = await getPayload({ config })

  /*
    Перевіряємо вхід самі.

    Payload власні сторінки адмінки НЕ захищає: маршрут він додає, а хто його
    відкрив — не питає. Перевірено на зібраному білді: без цієї перевірки
    анонімний запит до /admin/statistics повертав справжні суми й джерела
    просто в тілі відповіді. Екран входу при цьому малювався поверх — тобто
    на вигляд усе було гаразд, а дані вже поїхали.
  */
  const { user } = await payload.auth({ headers: await requestHeaders() })
  if (!user) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>Потрібно увійти</h1>
        <p style={{ opacity: 0.65 }}>Ця сторінка доступна лише після входу в адмінку.</p>
      </div>
    )
  }

  const since = await startOfPeriod(days)

  const orders = await payload.find({
    collection: 'orders',
    where: {
      paymentStatus: { equals: 'paid' },
      ...(since ? { createdAt: { greater_than: since } } : {}),
    },
    limit: 2000,
    depth: 0,
    sort: '-createdAt',
    overrideAccess: true,
  })

  const rows = new Map<string, { label: string; count: number; sum: number }>()
  for (const order of orders.docs) {
    const label = sourceLabel(order)
    const row = rows.get(label) ?? { label, count: 0, sum: 0 }
    row.count += 1
    row.sum += order.total ?? 0
    rows.set(label, row)
  }

  const sorted = [...rows.values()].sort((a, b) => b.sum - a.sum)
  const total = sorted.reduce((sum, row) => sum + row.sum, 0)
  const count = sorted.reduce((sum, row) => sum + row.count, 0)
  const biggest = sorted[0]?.sum || 1

  return (
    <div style={{ padding: '2rem', maxWidth: 880 }}>
      <h1 style={{ marginBottom: '.25rem' }}>Звідки замовлення</h1>
      <p style={{ opacity: 0.65, marginTop: 0 }}>
        Рахується з оплачених замовлень. На відміну від Google Analytics і пікселя Meta, сюди
        потрапляють усі покупці — і ті, хто не дав згоди на cookie, і ті, у кого блокувальник.
      </p>

      <div style={{ display: 'flex', gap: '.75rem', margin: '1.5rem 0' }}>
        {PERIODS.map((period) => (
          <a
            key={period.days}
            href={`?days=${period.days}`}
            style={{
              padding: '.35rem .8rem',
              border: '1px solid currentColor',
              borderRadius: 999,
              textDecoration: 'none',
              opacity: period.days === days ? 1 : 0.5,
            }}
          >
            {period.label}
          </a>
        ))}
      </div>

      <p style={{ fontSize: '1.1rem' }}>
        <strong>{count}</strong> замовлень на <strong>{money(total)}</strong>
      </p>

      {sorted.length === 0 ? (
        <p style={{ opacity: 0.65 }}>За цей період оплачених замовлень немає.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', opacity: 0.65, fontSize: '.8rem' }}>
              <th style={{ padding: '.5rem 0' }}>Джерело</th>
              <th style={{ padding: '.5rem 0', width: 90 }}>Замовлень</th>
              <th style={{ padding: '.5rem 0', width: 110 }}>Сума</th>
              <th style={{ padding: '.5rem 0', width: 70 }}>Частка</th>
              <th style={{ padding: '.5rem 0', width: 220 }} />
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.label} style={{ borderTop: '1px solid rgba(128,128,128,.25)' }}>
                <td style={{ padding: '.6rem 0' }}>{row.label}</td>
                <td>{row.count}</td>
                <td>{money(row.sum)}</td>
                <td>{total ? Math.round((row.sum / total) * 100) : 0}%</td>
                <td>
                  {/* Смужка — від найбільшого рядка, а не від суми: так видно
                      співвідношення між джерелами, а не частку цілого вдруге. */}
                  <div
                    aria-hidden="true"
                    style={{
                      height: 8,
                      borderRadius: 4,
                      background: 'currentColor',
                      opacity: 0.55,
                      width: `${Math.max(2, (row.sum / biggest) * 100)}%`,
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <p style={{ opacity: 0.55, fontSize: '.8rem', marginTop: '2rem' }}>
        «Прямий захід» — покупець набрав адресу сам, прийшов із закладки, з пошти або з
        застосунку, який джерела не передає. У частини з них насправді теж була реклама, але
        дізнатися це вже не можна.
      </p>
    </div>
  )
}

export default OrderSources
