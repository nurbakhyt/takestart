# TakeStart

Витрины для малого бизнеса с заказом через WhatsApp. Продавец ведёт каталог,
покупатель собирает корзину, заказ уходит продавцу в WhatsApp одной карточкой
(позиции, сумма, адрес, телефон).

Домен: `CONTEXT.md`, решения: `docs/adr/`.

## Стек

**`apps/web`** — Next.js App Router (edge) + `@opennextjs/cloudflare` (деплой на Workers),
Cloudflare D1 (Drizzle ORM) + R2 (фото товаров), Auth.js v5 (Google + email),
next-intl (ru/kk/en).

**`apps/ai`** — Cloudflare Workers + AI binding (sentiment analysis, `@cf/huggingface/distilbert-sst-2-int8`).

## Локальный запуск

```bash
pnpm install
pnpm dev             # http://localhost:3000 (web)
pnpm dev:ai          # http://localhost:8787 (ai worker)
```

Проверка: `pnpm typecheck`, `pnpm lint`, `pnpm build`,
воркер локально: `pnpm preview` (workerd + локальные D1/R2).

## Деплой

```bash
# web
pnpm db:migrate:local
pnpm db:seed:local
pnpm deploy

# ai
pnpm deploy:ai
```

## Деплой через Git (Workers Builds)

Дашборд Cloudflare → Worker `takestart` → Settings → Build:

| Поле | Значение |
| --- | --- |
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

```text                    # Next.js витрина + кабинет продавца
  app/[locale]/s/[slug]/     # витрина, checkout, success
  app/[locale]/dashboard/    # кабинет: магазины, товары, категории, заказы
  app/api/orders             # создание заказа + wa.me-ссылка
  app/api/images             # отдача фото из R2
  db/                        # drizzle-схема, миграции, seed.sql
  lib/                       # whatsapp-чек, D1-клиент, R2-хелперы
  messages/                  # ru/kk/en

apps/ai/                     # Cloudflare Workers AI (sentiment analysis)
  src/index.ts               # воркер с AI binding
```
