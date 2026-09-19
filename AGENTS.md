<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Дизайн — джерело істини

Верстку цього проєкту звіряють з макетом у Figma, а не з наявним кодом. Якщо
завдання звучить як «зроби верстку», «приведи до дизайну», «додай секцію» —
спочатку прочитай макет. Інакше ти просто продовжиш те, що вже написано, і
відтвориш стару версію дизайну, навіть не дізнавшись, що він змінився.

- Файл: `gt19wK3JKDWlBEyNyBDZCY` — «МК — Курси + Магазин».
  Ключ і решта налаштувань — у `parity.config.yaml`.
- Токен доступу вже є в оточенні як `FIGMA_TOKEN`.
- Читати так:

      curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
        "https://api.figma.com/v1/files/gt19wK3JKDWlBEyNyBDZCY/nodes?ids=<NODE>&depth=8"

- Ідентифікатори вузлів кожного екрана — десктоп 1440 і мобайл 390 — лежать у
  `.parity/packets/*.json`, поле `platforms.web.targets`.

## Обов'язково: перевіряй `visible`

У цьому файлі багато шарів мають `"visible": false`. У дереві вузлів вони
виглядають як справжні, але в макеті їх НЕ ВИДНО. Перш ніж щось верстати,
перевір `visible` самого вузла **і кожного його предка**.

Це не теоретична осторога. Через неї в код уже потрапила ціла секція «Журнал»
на сторінці курсів, якої в дизайні немає, і дубльовані картки в «Напрямах».

## Що не є джерелом істини

`.info/Структура і логіка дизайну — Figma.md` описує макет станом на 16.09 і
складений без перевірки `visible` — у ньому є секції, яких у дизайні немає.
Звіряйся з Figma, а не з цим файлом.

# Повторюється — виноси

Побачив той самий код удруге — не копіюй, а винось. Друга копія завжди починає
жити власним життям: одну правлять, другу забувають, і за тиждень вони різні.

Куди саме виносити:

- **Компонент** — коли повторюється розмітка. Приклади в проєкті: `SideDrawer`
  (бічна панель для фільтрів і форми відгуку), `MediaGallery` (слайдер фото на
  товарі й на курсі), `SaveButton` (серце на картках і сторінках).
- **Хук** — коли повторюється поведінка. `useScrollLock` замість трьох копій
  `document.body.style.overflow` у шапці, кошику й фільтрах.
- **Утиліта** — коли повторюється обчислення. `plural()` для відмінювання,
  `savedItems()` для читання обраного, `imageUrl()` для медіа.
- **Токен** — коли повторюється число або колір. Кеглі, відступи й кольори
  живуть у `@theme` і `:root` у `globals.css`: `--color-ink`, `--page-top`,
  `--header-row`, `--breakpoint-wide`. Захардкоджене число в другому місці —
  привід завести змінну, а не скопіювати.

Ознаки, що пора виносити:

- те саме число з макета стоїть у двох файлах;
- два компоненти мають однакові 10+ рядків розмітки чи ефекту;
- виправляєш баг і ловиш себе на тому, що те саме треба виправити ще десь.

Виносити варто **під час** правки, а не «колись потім»: саме тоді видно обидві
копії й зрозуміло, що в них спільного. Але не вигадуй абстракцію під один
випадок — виносять з другого, а не з першого.
