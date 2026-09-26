# TakeStart

Витрины для малого бизнеса: продавец ведёт каталог, покупатель собирает корзину,
заказ уходит продавцу в WhatsApp. Глоссарий домена — `CONTEXT.md`, решения —
`docs/adr/`.

## Прод

- **Прод-домен — `https://takestart.cc`**, обслуживает воркер `takestart` на
  Cloudflare (`workers.dev` выключен, кастомный домен в `wrangler.toml`).
  Ссылка на прод в текстах, QR и аниматиках — только `takestart.cc`.
- **Мерж в `main` выкатывает воркер `takestart` сам** (Cloudflare Workers Builds,
  root `apps/web`). Поэтому гейт перед оформлением пул-реквеста — локальный:
  `pnpm typecheck && pnpm lint && pnpm build`; CI в репозитории нет.
- **Схема БД на проде обновляется отдельным ручным шагом**:
  `wrangler d1 migrations apply DB --remote` из `apps/web` (в скриптах только
  `--local`). Новую миграцию этот шаг закрывает, старую — нет.

## Указатели

- **Визуал**: `DESIGN.md` — токены, типографика, раскладка, что отклонили и
  почему. Читай перед изменением разметки, стилей или текста на витрине и
  в кабинете.
- **Код**: `docs/agents/code.md` — форматы данных и ловушки рантайма (i18n,
  названия по языкам, биндинги Cloudflare, фото, заказ, где живут тесты).
  Читай перед правкой кода.
- **Процесс**: `docs/agents/workflow.md` — гейт, деплой, миграции, секреты,
  коммиты, навыки.
- **Стек и команды**: `README.md`. **Конкурентный анализ**: `docs/research/`.

## Agent skills

### Issue tracker

Issues live in GitHub Issues. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-label vocabulary (label = role name). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `CONTEXT.md` + `docs/adr/`. See `docs/agents/domain.md`.
