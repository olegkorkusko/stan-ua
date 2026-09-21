# STAN_UA — handmade jewellery shop & craft courses

A Ukrainian storefront that sells two very different things from one codebase:
physical products with colour/size variants and stock, and online courses whose
access is granted automatically the moment payment clears.

Next.js 16 and Payload CMS 3 run as a single application on PostgreSQL, deployed
to Vercel.

---

## Requirements

- Node 22 (developed on 22.14)
- Docker, for the local database and file storage

---

## Quick start

```bash
docker compose up -d        # PostgreSQL + MinIO
cp .env.example .env        # then generate your own PAYLOAD_SECRET

npm install
npm run seed                # admin user, course directions, courses, products, reviews
npm run seed:content        # static pages, journal posts, kit add-ons
npm run storage:sync        # creates the media bucket
npm run seed:photos         # uploads 29 images from seed-assets/ into the media library

npm run dev
```

| | |
|---|---|
| Site | http://localhost:3000 |
| Admin | http://localhost:3000/admin — `admin@mk.local` / `mk-admin-2026` |
| Demo customer | `customer@mk.local` / `mk-customer-2026` |
| MinIO console | http://localhost:9001 — `mkadmin` / `mkminio123` |

**Open `localhost`, not `127.0.0.1`.** Next returns 403 for client chunks
requested from an origin outside `allowedDevOrigins`. The page still renders, so
it looks fine — it just never becomes interactive, with nothing in the console to
explain why. Both hosts are listed in `next.config.ts`, but only one of them is
what you typed.

**Keep the repository on a case-preserving, link-capable filesystem** (APFS,
ext4, NTFS). On exFAT, Turbopack cannot create junction points and dies with
`os error 1`; falling back to `--webpack` corrupts the dev cache instead, and the
RSC stream breaks mid-flight with `SyntaxError: Unexpected end of JSON input` —
again producing a page that renders but does not respond to clicks.

---

## Layout

```
src/
  app/(frontend)/     the storefront
  app/(payload)/      admin panel and Payload's REST/GraphQL API
  collections/        data model: products, variants, courses, orders, customers…
  globals/            site settings, About page
  components/site/    header, drawers, cards, forms
  components/admin/   small admin-only components
  components/ui/      shadcn primitives
  lib/                pricing, media, i18n, access checks, integrations
  migrations/         generated database migrations — see Deployment
  seed/               demo content and the product importer
```

---

## How a purchase works

```
cart → /checkout → POST /api/checkout → WayForPay form
     → POST /api/payments/wayforpay/callback → fulfillOrder()
```

Everything that matters happens in `fulfillOrder()` (`lib/orders.ts`), and only
after the payment provider confirms:

- Telegram invite links are minted per buyer, `member_limit: 1`, valid 24 hours.
  One link, one person — forwarding it to a friend does not work. Channel
  membership itself is permanent; only the link expires.
- Stock is decremented under a row lock inside a transaction.
- A customer account is created from the order's email, with a random password.
  Buyers never register; they later sign in with an emailed link.
- A fiscal receipt is issued through Checkbox, as Ukrainian law requires for card
  payments.
- The purchase event is sent to Meta **from the server**, so it still counts for
  visitors running an ad blocker.
- The owner gets a Telegram message; the buyer gets an email with their links.

**Prices and stock are always recalculated server-side.** The browser's cart is a
list of wishes, never a source of amounts.

**The callback is only trusted with a valid HMAC-MD5 signature**, and the reply is
signed too — otherwise WayForPay keeps retrying. `fulfillOrder` is idempotent, so
a repeated callback cannot decrement stock twice.

### Without third-party keys

The application degrades instead of failing, which is what makes local
development possible at all:

| Missing | Behaviour |
|---|---|
| `WAYFORPAY_*` | Order is still created, marked as awaiting payment, visible in the admin |
| `TELEGRAM_BOT_TOKEN` | Invite generation is skipped silently |
| `NOVA_POSHTA_API_KEY` | Address autocomplete turns off; the field accepts free text |
| `RESEND_API_KEY` | Emails are written to the console |
| `CHECKBOX_*` | No receipt is issued |

The one failure this cannot cover: if the Telegram bot is not an administrator of
a course channel **with the "invite users via link" permission**, invites come
back empty and the buyer receives an email with no access link. Check that
permission before selling anything.

---

## Two languages

Ukrainian lives at the root (`/shop`), English behind a prefix (`/en/shop`). The
primary market does not pay a redirect for a language added for later. There is
one page tree: `src/middleware.ts` rewrites `/en/*` to `/*` and passes the locale
along in a request header.

- `lib/i18n.ts` — interface strings and `localePath()`
- `components/site/LocaleLink.tsx` — a drop-in for `next/link` that keeps the
  visitor in their language. Every internal link goes through it.

The interface is fully translated. **Content is not**: fields are localised, but
the English values are empty in the database, so Payload falls back to Ukrainian
until someone fills them in.

---

## Deployment

Vercel + Neon (PostgreSQL) + S3-compatible storage. `DEPLOY.md` has the full
walkthrough; `.info/` holds the client-facing checklist of accounts and keys.

### Migrations are not optional

Payload only pushes schema when `NODE_ENV !== 'production'`
(`db-postgres/dist/connect.js:110`). On Vercel that variable is always
`production`, so **push never runs** and a deploy without migrations would bring
the site up against a database with no tables at all.

`vercel.json` therefore sets:

```json
"buildCommand": "payload migrate && next build"
```

After changing any collection:

```bash
npm run migrate:create <short-name>   # generate a migration from the diff
npm run migrate:status                # what has run, what has not
```

**Commit the generated file.** Without it, production never learns about the
change.

The migration command deliberately lives in `vercel.json` rather than in the
`build` script: a local database carries a `dev` marker row (`batch = -1`) left by
push mode, and `payload migrate` stops on it and waits for keyboard confirmation.
Inside `build`, that would hang `npm run build` forever with no explanation.

Before merging a schema change, run the migration against an **empty** database,
not just your own — that is how you catch a migration which silently depends on
data that a fresh install does not have.

### The admin panel is generated code away from breaking

`src/app/(payload)/admin/importMap.js` is generated. When it falls out of sync
with the config — a new editor feature, a storage plugin, a custom field
component — the admin renders a **blank white page**, with only
`PayloadComponent not found in importMap` in the console to go on. The fix:

```bash
npm run generate:importmap
```

Run it after any change to `payload.config.ts` or to admin components, and commit
the result.

---

## Storage

Media lives in S3, not on the application disk, because Vercel's filesystem is
discarded on every deploy. MinIO plays the same role locally, so moving to AWS S3
or Cloudflare R2 changes only the `S3_*` values — never the code.

Files are served through `/api/media/file/<name>`, which means the bucket can stay
private: no public-read policy required.

`npm run storage:sync` creates the bucket and uploads anything sitting in the
local `media/` folder. Database records store only filenames, so migrating
between providers with the same keys needs no data changes.

---

## Bulk product import

The client fills in a spreadsheet; the importer creates products with their full
variant matrix.

```bash
npm run import:products -- products.csv dry   # dry run, writes nothing
npm run import:products -- products.csv
```

`dry` has no dashes on purpose: `payload run` swallows arguments starting with
`--` before the script sees them.

Download the template from the admin, or from `/api/admin/products-template`
(admin session required). Re-running is safe — a product whose title already
exists is skipped rather than duplicated. Colours, sizes and categories that do
not exist yet are created. Photos are not imported; they are uploaded in the
admin.

---

## Conventions worth knowing before you edit

**Formatting.** Prices are formatted by hand in `lib/format.ts`, not through
`Intl.NumberFormat`: Node and the browser disagree about the space before `₴`,
and hydration breaks over it.

**Denormalised fields.** `priceFrom`, `inStock` and `totalStock` are computed by a
hook on save so filtering is a database query rather than an in-memory scan.

**Concurrency.** `decrementStock` runs in a transaction with `SELECT … FOR UPDATE`.
Without the lock, two simultaneous orders for the last item both succeed.

**The dictionary contains functions**, so it cannot be passed as a prop from a
server component to a client one. Client components call `useLocale()` and build
their own.

**Never name an array field `order`** in Payload — it collides with the internal
ordering column.

**`tailwind-merge` treats unknown `text-*` classes as colours.** A custom size
token like `text-title` next to `text-ink` looks like two colours to it, and it
silently keeps the last one — the heading quietly drops to 16px. Every custom
`--text-*` must also be listed in `cn()` in `lib/utils.ts`.

**Custom breakpoints must be declared in rem.** Tailwind emits pixel-valued
breakpoints *before* the built-in rem ones, so `md:` would win at every width.

**`position: sticky` only works inside a tall parent.** Both the header and the
catalog filter row had to be hoisted to page root; inside their original wrappers
they were sticky within a box their own height, which is to say not at all.

---

## Design is the source of truth

Layout is verified against a Figma file, not against the existing code. Frozen
snapshots live in `.parity/packets/`; each one records the node ids for desktop
(1440) and mobile (390).

Before building anything, check the `visible` flag on the node **and on every
ancestor**. The file contains many hidden layers that look real in the node tree.
This is not a hypothetical: a whole "Journal" section that does not exist in the
design once made it into the courses page this way.

Deliberate departures from the design are marked in comments next to the node id
they diverge from, so that a later reader can tell a decision from an oversight.

---

## Repeated code gets extracted

See the second copy, extract it — the second copy always starts living its own
life. Components for repeated markup (`SideDrawer`, `MediaGallery`, `SaveButton`),
hooks for repeated behaviour (`useScrollLock`), utilities for repeated
computation (`plural()`, `savedItems()`), tokens for repeated numbers and colours
(`globals.css`).

Extract *while* editing, when both copies are in front of you. Do not invent an
abstraction for a single case.

---

## Documentation

| File | Audience |
|---|---|
| `DEPLOY.md` | Whoever ships it |
| `ІНСТРУКЦІЯ.md` | The shop owner — how to run the admin, in Ukrainian |
| `AGENTS.md` | Coding agents working in this repository |

---

## Not done yet

- English content in Payload — the interface is translated, the data is not.
- Live verification of the payment, receipt, Telegram and analytics paths. The
  code is written and degrades safely, but none of it has been run end to end
  against real credentials.
- Production deployment: Vercel, Neon, domain, redirects from the old site.
