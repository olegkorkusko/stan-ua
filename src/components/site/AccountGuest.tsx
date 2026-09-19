import { AuthForm } from '@/components/site/AuthForm'
import type { dictionary } from '@/lib/i18n'

/*
  Що бачить гість на будь-якій із трьох вкладок кабінету.

  У макеті цього екрана немає — там усюди намальовано вже авторизованого
  покупця. Тому верстка лишилась така, якою була на сторінці кабінету до
  приведення до дизайну: підпис, заголовок і форма входу. Зʼявиться кадр —
  буде що звіряти.
*/
export const AccountGuest = ({ t }: { t: ReturnType<typeof dictionary> }) => (
  <div className="shell py-32">
    <p className="label text-center">{t.account.label}</p>
    <h1 className="mt-3 text-center text-page">{t.account.guestTitle}</h1>
    <div className="mt-12">
      <AuthForm />
    </div>
  </div>
)
