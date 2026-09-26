# Как здесь ведётся работа

## Гейт перед коммитом

- Локальный, из корня репозитория: `pnpm typecheck`, `pnpm lint`, `pnpm build`
  (все три команды нацелены только на `apps/web`). Для воркера перевода:
  `pnpm --filter takestart-ai typecheck` и `pnpm --filter takestart-ai test`.
- CI в репозитории нет: ветка, проверенная только глазами, остаётся непроверенной.
- Форматирования тоже нет — ни prettier, ни editorconfig. Держись соседних строк
  и не прогоняй автоформаттер по всему файлу: диффы засоряются.

## Прод

- Мерж в `main` выкатывает воркер `takestart` сам: Cloudflare Workers Builds,
  root `apps/web`, build `pnpm run build`, deploy `pnpm run deploy`. Отдельного
  шага деплоя в процессе нет, `workers.dev` выключен — трафик идёт на
  `takestart.cc`.
- Превью деплоя — ручной `pnpm --filter web upload`; в CI он не запускается.
- Настройки панели и почему build с deploy разделены — в `README.md`,
  раздел «Деплой через Git».

## Миграции БД

- `pnpm db:generate` → SQL в `apps/web/db/migrations/` и снапшот в `meta/`.
  Файлы коммитятся вместе со схемой.
- Локально: `pnpm db:migrate:local`, сид — `pnpm db:seed:local`.
- На проде: `wrangler d1 migrations apply DB --remote` из `apps/web`. Это ручной
  шаг — в `package.json` есть только `--local`-вариант. Пока он не выполнен,
  воркер с новой схемой работает против старой базы, и это не видно ни в линте,
  ни в сборке.

## Ветки и коммиты

- Conventional Commits, английский, scope по приложению: `feat(web):`,
  `fix(ai):`, `fix(auth):`, `docs:`, `chore(web):`. Номер issue — в скобках
  в конце: `(#5)`.
- Ранняя история коммитов этому стилю не следует; новые следуют.

## Навыки

- Карта скиллов и путь по ним — роутер `.pi/skills/ask-matt/SKILL.md`.
- Набор зафиксирован в `skills-lock.json` (mattpocock/skills) и лежит в
  `.agents/skills/`; `.pi/skills/*` и `.claude/skills/*` — симлинки на него,
  так что копий нет, а правка идёт в одно место.
