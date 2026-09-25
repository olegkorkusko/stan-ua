/*
  Знак у шапці адмінки — там, де Payload малює свій ромб.

  Файл той самий, що й на сторінці входу: власного квадратного знака в бренду
  немає, є напис. Тому він не вписується в квадрат, а лягає смужкою — висота
  по рядку, ширина скільки треба. Розміри живуть в admin.css поруч з .mk-logo.
*/
export const Icon = () => (
  // eslint-disable-next-line @next/next/no-img-element -- див. коментар у Logo.tsx
  <img src="/home/logo.png" alt="STAN_UA market" width={667} height={190} className="mk-icon" />
)
