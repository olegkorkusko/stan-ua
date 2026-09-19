// Скелет сітки курсів. Як і в каталозі товарів, лежить на самому сегменті:
// у корені loading.tsx перетворив би 404 сторінок-деталей на м'яку 200, бо
// стримінг починається раніше, ніж спрацює notFound().
const Loading = () => (
  <div className="shell min-h-[60vh] py-24" aria-busy="true" aria-live="polite">
    <span className="sr-only">Завантаження курсів</span>

    <div className="h-3 w-24 animate-pulse bg-flax" />
    <div className="mt-6 h-9 w-2/3 max-w-md animate-pulse bg-flax" />

    <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i}>
          <div className="aspect-[16/11] animate-pulse bg-flax" />
          <div className="mt-4 h-3 w-3/4 animate-pulse bg-flax" />
          <div className="mt-2 h-3 w-1/3 animate-pulse bg-flax" />
        </div>
      ))}
    </div>
  </div>
)

export default Loading
