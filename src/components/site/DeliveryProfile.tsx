'use client'

import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'

import { Suggest, useSuggestions } from '@/components/site/AddressSuggest'
import { useLocale } from '@/components/site/LocaleLink'
import { SideDrawer } from '@/components/site/SideDrawer'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  deliveryMethodOptions,
  paymentMethodOptions,
  type DeliveryMethod,
  type PaymentMethod,
} from '@/lib/delivery'
import { dictionary } from '@/lib/i18n'

/*
  «Дані для доставки» за макетом (138:3268 на 1440, 309:5414 на 390).

  Три блоки з заливкою #F2EFE9 і полями 28: на десктопі в ряд по 432 із кроком
  32, на мобільному колонкою з кроком 16. Усередині блоку — підпис, три рядки
  «назва / значення» й «Змінити», крок 18.

  Редагування відкривається в бічній панелі, а не окремою сторінкою: панель у
  проєкті вже є (фільтри, відгук), а сторінки редагування в макеті немає. Це ще
  й лишає кадр недоторканим — панель лежить поверх нього й у звіряння не
  потрапляє.

  Одна панель на всі три «Змінити» навмисно: поля тут повʼязані (спосіб
  доставки визначає, що писати у «відділенні»), і три окремі форми довелося б
  тримати синхронними між собою.
*/

/*
  Вибір із переліку. Три селекти нижче однакові до знака — спосіб доставки,
  спосіб оплати й канал чека, — тому обгортка одна, а не три копії розмітки.

  NONE — службове значення для рядка «не вказано». Radix не дозволяє порожній
  рядок у значенні елемента: для нього «порожньо» означає «нічого не вибрано»,
  і такий пункт не можна було б ані показати, ані натиснути.
*/
const NONE = '__none__'

const Choice = <T extends string>({
  label,
  value,
  onChange,
  options,
  labels,
  blank,
}: {
  label: string
  value: T | null
  onChange: (next: T | null) => void
  options: readonly { value: T }[]
  labels: Record<T, string>
  blank: string
}) => (
  /*
    Підпис видимий, а не лише в aria-label. У блоці «Оплата» два списки
    поспіль, і без підписів другий читався як частина першого: людина бачила
    «Карткою онлайн» і «На пошту» й не розуміла, що «на пошту» — це про чек.
  */
  <label className="flex flex-col gap-1.5">
    <span className="text-[13px] leading-[19.5px] text-muted">{label}</span>
    <Select
      value={value ?? NONE}
      onValueChange={(next) => onChange(next === NONE ? null : (next as T))}
    >
      <SelectTrigger aria-label={label}>
        <SelectValue placeholder={blank} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>{blank}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {labels[option.value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </label>
)

export type DeliveryProfileValues = {
  name: string
  phone: string
  email: string
  deliveryMethod: DeliveryMethod | null
  deliveryCity: string
  deliveryBranch: string
  paymentMethod: PaymentMethod | null
  cardMask: string
}

type Nodes = {
  section: string
  blocks: {
    root: string
    label: string
    rows: { root: string; name: string; value: string }[]
    edit: string
  }[]
}

export const DeliveryProfile = ({
  values,
  nodes,
}: {
  values: DeliveryProfileValues
  nodes: Nodes
}) => {
  const router = useRouter()
  const t = dictionary(useLocale()).account.delivery
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(values)

  /*
    Підказки ті самі, що й на оформленні — див. AddressSuggest.

    Ref міста тримаємо окремо: у профілі збережена лише назва, а довідник
    відділень шукає за ref. Поки місто не вибрали зі списку, відділення
    доводиться вписувати руками — так само, як на оформленні, коли людина
    приходить із заповненим профілем.
  */
  const [cityRef, setCityRef] = useState('')
  const [cityTouched, setCityTouched] = useState(false)
  const [branchPicked, setBranchPicked] = useState(false)
  const isUkrposhta = form.deliveryMethod === 'ukrposhta'

  const cities = useSuggestions('city', form.deliveryCity, undefined, !isUkrposhta)
  const branches = useSuggestions('branch', form.deliveryBranch, cityRef, !isUkrposhta)

  const set =
    <K extends keyof DeliveryProfileValues>(key: K) =>
    (value: DeliveryProfileValues[K]) =>
      setForm((current) => ({ ...current, [key]: value }))

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/account/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        setError(data.error ?? t.failed)
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setError(t.failed)
    } finally {
      setBusy(false)
    }
  }

  // Порожнє поле — прочерк, а не порожнеча: інакше рядок складається й ритм
  // блоку розʼїжджається.
  const shown = (value: string | null | undefined) => value || t.blank

  const blocks: { rows: { name: string; value: string }[] }[] = [
    {
      rows: [
        { name: t.name, value: shown(values.name) },
        { name: t.phone, value: shown(values.phone) },
        { name: t.email, value: shown(values.email) },
      ],
    },
    {
      rows: [
        { name: t.method, value: values.deliveryMethod ? t.methods[values.deliveryMethod] : t.blank },
        { name: t.city, value: shown(values.deliveryCity) },
        { name: t.branch, value: shown(values.deliveryBranch) },
      ],
    },
    {
      rows: [
        {
          name: t.method,
          value: values.paymentMethod ? t.payments[values.paymentMethod] : t.blank,
        },
        { name: t.card, value: values.cardMask ? `•••• ${values.cardMask}` : t.blank },
      ],
    },
  ]

  const titles = [t.contacts, t.address, t.payment]

  return (
    <>
      <div
        data-figma-node={nodes.section}
        className="flex flex-col gap-4 md:flex-row md:gap-8"
      >
        {blocks.map((block, index) => {
          const map = nodes.blocks[index]

          return (
            <div
              key={titles[index]}
              data-figma-node={map?.root}
              className="flex flex-1 flex-col gap-[18px] bg-paper-deep p-7"
            >
              <p
                data-figma-node={map?.label}
                className="text-[11px] font-semibold uppercase leading-[15px] tracking-[0.16em] text-muted"
              >
                {titles[index].toUpperCase()}
              </p>

              {block.rows.map((row, rowIndex) => (
                <div
                  key={row.name}
                  data-figma-node={map?.rows[rowIndex]?.root}
                  className="flex items-center gap-3 text-[13px] font-normal leading-5"
                >
                  <span data-figma-node={map?.rows[rowIndex]?.name} className="text-muted">
                    {row.name}
                  </span>
                  <span
                    data-figma-node={map?.rows[rowIndex]?.value}
                    className="min-w-0 truncate text-ink"
                  >
                    {row.value}
                  </span>
                </div>
              ))}

            </div>
          )
        })}
      </div>

      {/*
        Одна кнопка на всі три блоки, а не три однакові.

        У макеті «Змінити» стоїть під кожним (138:3280, 3292, 3304), але
        шухляда одна й відкриває всі поля одразу — хоч на що натисни. Три
        кнопки обіцяли три різні дії, а робили одну.

        -mb: .thread-link тримає під написом 2 px під нитку, і без цього
        сторінка виходила на 2 px вищою, ніж у макеті.
      */}
      <button
        type="button"
        onClick={() => {
          setForm(values)
          setOpen(true)
        }}
        data-figma-node={nodes.blocks[0]?.edit}
        className="thread-link -mb-[2px] mt-6 self-start text-[13px] font-normal leading-5 text-ink transition-opacity hover:opacity-60 active:opacity-40"
      >
        {t.edit}
      </button>

      <SideDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={t.address}
        closeLabel={t.close}
        footer={
          <div className="flex flex-col gap-2">
            {error && <p className="text-xs text-brass">{error}</p>}
            <button type="button" disabled={busy} onClick={save} className="btn btn-primary w-full">
              {busy ? t.saving : t.save}
            </button>
          </div>
        }
      >
        {/* Прокрутку дає сама шухляда — другий overflow тут малював другу смугу. */}
        <div className="flex flex-col gap-6">
          <Fieldset title={t.contacts}>
            <input
              className="field"
              aria-label={t.name}
              placeholder={t.name}
              value={form.name}
              onChange={(event) => set('name')(event.target.value)}
            />
            <input
              type="tel"
              className="field"
              aria-label={t.phone}
              placeholder={t.phone}
              value={form.phone}
              onChange={(event) => set('phone')(event.target.value)}
            />
            {/* Пошта — це логін, її зміна означала б зміну облікового запису.
                Показуємо, але не даємо правити тут. */}
            <p className="text-xs text-muted">
              {t.email}: {values.email}
            </p>
          </Fieldset>

          <Fieldset title={t.address}>
            <Choice
              label={t.method}
              value={form.deliveryMethod}
              onChange={set('deliveryMethod')}
              options={deliveryMethodOptions}
              labels={t.methods}
              blank={t.blank}
            />
            <Suggest
              label={t.city}
              placeholder={t.city}
              value={form.deliveryCity}
              show={cityTouched && !cityRef}
              items={cities.items}
              onChange={(value) => {
                setCityTouched(true)
                set('deliveryCity')(value)
                setCityRef('')
              }}
              onPick={(item) => {
                set('deliveryCity')(item.label)
                setCityRef(item.ref)
                set('deliveryBranch')('')
                setBranchPicked(false)
              }}
            />
            <Suggest
              label={t.branch}
              placeholder={t.branch}
              value={form.deliveryBranch}
              show={!branchPicked && form.deliveryMethod !== 'np_courier'}
              items={branches.items}
              onChange={(value) => {
                set('deliveryBranch')(value)
                setBranchPicked(false)
              }}
              onPick={(item) => {
                set('deliveryBranch')(item.label)
                setBranchPicked(true)
              }}
            />
          </Fieldset>

          <Fieldset title={t.payment}>
            <Choice
              label={t.paymentMethodLabel}
              value={form.paymentMethod}
              onChange={set('paymentMethod')}
              options={paymentMethodOptions}
              labels={t.payments}
              blank={t.blank}
            />
            {/* Картку не редагуємо: її маска приходить від платіжки. */}
            <p className="text-xs text-muted">
              {t.card}: {values.cardMask ? `•••• ${values.cardMask}` : t.blank}
            </p>
          </Fieldset>
        </div>
      </SideDrawer>
    </>
  )
}

const Fieldset = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-2">
    <p className="label">{title}</p>
    {children}
  </section>
)
