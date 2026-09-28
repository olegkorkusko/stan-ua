import Image, { type ImageProps } from 'next/image'

/*
  Заглушка на місці фото.

  Порожній сірий прямокутник читається як поломка: покупець бачить діру й не
  розуміє, це товар без фото чи сайт не довантажився. Тому порожнеча мусить
  виглядати навмисною — переплетення, а поверх нього знак бренду.

  Знак ховається на дрібних кадрах: у рядку кошика (72 px) і в наборах до
  товару (44 px) він перетворюється на пляму. Поріг рахується від ширини
  самого кадру, а не вікна, — та сама заглушка стоїть і в картці на пів
  екрана, і в тому рядку кошика.
*/
export const NoPhoto = ({ node, className = '' }: { node?: string; className?: string }) => (
  <div
    data-figma-node={node}
    aria-hidden="true"
    className={`weave @container grid h-full w-full place-items-center ${className}`}
  >
    <Image
      src="/home/logo.png"
      alt=""
      width={667}
      height={190}
      sizes="240px"
      className="hidden h-auto w-[46%] max-w-60 opacity-20 @min-[7rem]:block"
    />
  </div>
)

type PictureProps = Omit<ImageProps, 'src' | 'alt'> & {
  /** Порожньо або null — замість фото стане заглушка. */
  src?: string | null
  alt: string
  /** Вузол Figma: лягає і на фото, і на заглушку. */
  node?: string
}

/*
  Фото з бази — або заглушка, якщо його немає.

  Перевірка «є адреса — малюй Image, немає — заглушку» стояла в девʼяти
  місцях, а ще в трьох її просто забули: картка журналу на /shop лишала сіру
  діру, а картки категорій і напрямів підставляли чуже демонстраційне фото з
  public і падали, щойно клієнтка додавала в адмінці зайву картку. Тепер
  забути неможливо.

  className і решта пропсів ідуть лише на фото: object-cover і зум при
  наведенні заглушці ні до чого.
*/
export const Picture = ({ src, alt, node, ...rest }: PictureProps) =>
  src ? <Image src={src} alt={alt} data-figma-node={node} {...rest} /> : <NoPhoto node={node} />
