# Cloudflare Workers + OpenNext вместо Pages

Заменяет платформенную часть [ADR-0001](0001-stack-pages-d1-r2.md): Next.js App
Router, D1 и R2 остаются, но собирается и запускается это как воркер
`@opennextjs/cloudflare` (`apps/web/open-next.config.ts`, вход воркера
`.open-next/worker.js` в `apps/web/wrangler.toml`), а не как Pages-проект.
`next-on-pages` в репозитории не использовался ни разу, так что это не смена
решения, а приведение ADR в соответствие с кодом.

Что из этого следует и обязательно к соблюдению:

- **Биндинги живут только в рантайме запроса.** `DB` (D1), `SHOP_IMAGES` (R2) и
  `AI_SERVICE` (service binding на `takestart-ai`) не существуют во время сборки:
  Next-конфиг и конфиг Auth.js — ленивые колбэки, берут `env` через
  `getCloudflareContext()` изнутри функции. Клиент БД создаётся функцией
  (`apps/web/db/index.ts`), а не константой уровня модуля.
- **Build ≠ deploy.** `pnpm build` — это чистый `next build` (вывод в `.next/`),
  а воркеру нужен артефакт `opennextjs-cloudflare build` в `.open-next/`.
  Поэтому `pnpm deploy` = `opennextjs-cloudflare build && opennextjs-cloudflare deploy`,
  и в панели Cloudflare (Workers Builds) build-команда и deploy-команда разведены,
  root — `apps/web`.
- **Трафик идёт на кастомный домен** `takestart.cc`: `workers_dev = false`,
  `workers.dev`-поддомен выключен намеренно.
- **Прод выкатывается мержем в `main`** — отдельного шага деплоя в процессе нет.
