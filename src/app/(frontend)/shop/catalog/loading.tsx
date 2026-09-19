// Скелет сітки каталогу. Лежить саме тут, а не в корені: loading.tsx відкриває
// Suspense-межу на весь сегмент разом із нащадками, відповідь одразу починає
// стримитись зі статусом 200, і notFound() у сторінках-деталях уже не може
// повернути справжню 404. У /shop/catalog нащадків немає, тож це безпечно.
const Loading = () => (
  <div className="shell min-h-[60vh] py-24" aria-busy="true" aria-live="polite">
    <span className="sr-only">Завантаження каталогу</span>

    <div className="h-3 w-24 animate-pulse bg-flax" />
    <div className="mt-6 h-9 w-2/3 max-w-md animate-pulse bg-flax" />

    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i}>
          <div className="aspect-[4/5] animate-pulse bg-flax" />
          <div className="mt-4 h-3 w-3/4 animate-pulse bg-flax" />
          <div className="mt-2 h-3 w-1/3 animate-pulse bg-flax" />
        </div>
      ))}
    </div>
  </div>
)

export default Loading
