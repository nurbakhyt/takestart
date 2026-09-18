# TakeStart

Витрины для малого бизнеса с заказом через WhatsApp. Продавец ведёт каталог,
покупатель собирает корзину, заказ уходит продавцу в WhatsApp одной карточкой
(позиции, сумма, адрес, телефон).

Домен: `CONTEXT.md`, решения: `docs/adr/`.

## Стек

Next.js App Router (edge) + `@opennextjs/cloudflare` (деплой на Workers),
Cloudflare D1 (Drizzle ORM) + R2 (фото товаров), Auth.js v5 (Google + email),
next-intl (ru/kk/en).

## Локальный запуск

```bash
pnpm install
cp apps/web/.dev.vars.example apps/web/.dev.vars  # AUTH_SECRET: npx auth secret
pnpm db:migrate:local
pnpm db:seed:local   # демо-кафе Dana Food → /ru/s/dana-food
pnpm dev             # http://localhost:3000
```

Проверка: `pnpm typecheck`, `pnpm lint`, `pnpm build`,
воркер локально: `pnpm preview` (workerd + локальные D1/R2).

## Первый деплой

```bash
pnpm wrangler login
pnpm --filter web exec wrangler d1 create takestart-db
# database_id → apps/web/wrangler.toml
pnpm --filter web exec wrangler r2 bucket create takestart-images
pnpm --filter web exec wrangler d1 migrations apply DB --remote
pnpm wrangler secret put AUTH_SECRET        # npx auth secret
pnpm wrangler secret put AUTH_GOOGLE_ID
pnpm wrangler secret put AUTH_GOOGLE_SECRET # Google Cloud Console → OAuth client
pnpm wrangler secret put AUTH_RESEND_KEY    # resend.com → API key
pnpm deploy
```

Google OAuth: redirect URI — `https://<ваш-домен>/api/auth/callback/google`.
Resend: адрес в `AUTH_RESEND_FROM` должен быть на подтверждённом домене.

## Деплой через Git (Workers Builds)

Дашборд Cloudflare → Worker `takestart` → Settings → Build:

| Поле | Значение |
|---|---|
| Root directory | `apps/web` |
| Build command | `pnpm run build` |
| Deploy command | `pnpm run deploy` |
| Production branch | `main` |

Build variable: `NODE_VERSION=22`. Watch paths: include `apps/web/**`.

Почему так: `pnpm run build` — это чистый `next build` (вывод в `.next/`),
а воркеру нужен `.open-next/worker.js` из `opennextjs-cloudflare build`
(`main` в `apps/web/wrangler.toml`). `pnpm run deploy` делает `build && deploy`
сразу — как Deploy-команда это двойной билд, поэтому build и deploy разделены.
Preview идёт через `opennextjs-cloudflare upload` (скрипт `upload`),
а не голый `wrangler versions upload` — иначе пропустятся populateCache
и deployment mapping OpenNext.

## Структура


```
apps/web/
  app/[locale]/s/[slug]/   # витрина, checkout, success
  app/[locale]/dashboard/  # кабинет: магазины, товары, категории, заказы
  app/api/orders           # создание заказа + wa.me-ссылка
  app/api/images           # отдача фото из R2
  db/                      # drizzle-схема, миграции, seed.sql
  lib/                     # whatsapp-чек, D1-клиент, R2-хелперы
  messages/                # ru/kk/en
```
