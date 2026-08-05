import type { Metadata } from 'next'

import { ResetForm } from '@/components/site/ResetForm'

export const metadata: Metadata = {
  title: 'Вхід у кабінет',
  robots: { index: false },
}

type SearchParams = Promise<{ token?: string }>

const ResetPage = async ({ searchParams }: { searchParams: SearchParams }) => {
  const { token } = await searchParams

  return (
    <div className="shell py-32">
      <p className="label text-center">Кабінет</p>
      <h1 className="mt-3 text-center text-[clamp(1.75rem,3.5vw,2.75rem)]">Задайте пароль</h1>
      <p className="mx-auto mt-4 max-w-sm text-center text-sm leading-relaxed text-muted">
        Далі заходитимете з ним — або знову через посилання на пошту, як зручніше.
      </p>
      <div className="mt-10">
        <ResetForm token={token} />
      </div>
    </div>
  )
}

export default ResetPage
