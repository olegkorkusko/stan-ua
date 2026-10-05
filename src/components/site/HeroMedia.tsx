import { Picture } from '@/components/site/Picture'

/*
  Підкладка банера: відео, якщо його завантажили, інакше фото.

  Три місця мають однакову вимогу — кадр на всю ширину, по якому йде текст:
  перший екран «Магазину», перший екран «Навчання» й дві половинки головної.
  Писати це втретє означало б отримати три різні набори атрибутів у <video>,
  а кожен з них — окремий спосіб зламати автопрогравання.

  Чому саме ці чотири атрибути:

  - muted      — без нього браузер НЕ запустить відео сам. Це не наше рішення
                 і не налаштування: автоплей зі звуком заборонений усюди.
  - playsInline — iPhone інакше відкриває відео на весь екран поверх сайту.
  - loop       — банер не має закінчуватись чорним кадром.
  - poster     — те саме фото. Поки відео вантажиться (а це мегабайти), на
                 його місці стоїть картинка, а не порожнеча.

  Відео беремо як є: next/image його не чіпає, а Payload зменшує лише
  зображення. Тому стеля на файл у 15 МБ тут не формальність — це єдине, що
  стоїть між банером і тим, щоб сторінка вантажилась пів хвилини.
*/
export const HeroMedia = ({
  video,
  image,
  alt,
  node,
  sizes = '100vw',
  priority = false,
  className = 'object-cover',
}: {
  video?: string | null
  image?: string | null
  alt: string
  node?: string
  sizes?: string
  priority?: boolean
  className?: string
}) => {
  if (video) {
    return (
      <video
        data-figma-node={node}
        src={video}
        poster={image ?? undefined}
        autoPlay
        muted
        loop
        playsInline
        // Відео декоративне: сенс несе текст поверх нього, і диктор має
        // читати саме текст, а не оголошувати беззвучний ролик.
        aria-hidden="true"
        className={`absolute inset-0 h-full w-full ${className}`}
      />
    )
  }

  return <Picture src={image} alt={alt} node={node} fill sizes={sizes} priority={priority} className={className} />
}
