# Инварианты кода

Что нельзя вывести из чтения кода: форматы данных и ловушки рантайма Cloudflare.
Читай перед правкой кода в `apps/web` / `apps/ai`.

## Время и деньги

- Время — целые epoch-ms (`Date.now()`), колонки `created_at`. Новую колонку
  времени добавляй хелпером `createdAt()` из `apps/web/db/schema.ts`, а не
  собственной строкой в схеме.
- Деньги — целые тиыны в колонках `*_tiyin`; дробной части у тенге нет.
  Форматирование только через `formatKZT()` из `apps/web/lib/locale-text.ts`.

## Тексты живут в трёх местах

- **Интерфейс** — next-intl, каталоги `apps/web/messages/{ru,kk,en}.json`
  (сейчас по 170 ключей в каждом). Новую строку добавь во все три файла:
  паритет ключей ничем не проверяется, о нём узнаётся только на проде.
- **Локали** — `ru | kk | en`, по умолчанию `ru` (`apps/web/i18n/routing.ts`).
- **Чек в WhatsApp** — отдельный словарь `LABELS` в `apps/web/lib/whatsapp.ts`,
  а не next-intl. Правка языка чека идёт туда.

## Названия товаров и категорий — по языкам

- `products` и `categories` хранят `name_ru` (обязательно) плюс `name_kk` /
  `name_en`, которые заполняет кнопка AI-перевода: `POST /api/dashboard/translate`
  → service binding `AI_SERVICE` → воркер `takestart-ai`. Описания — `desc_ru` /
  `desc_kk` / `desc_en`, все опциональны.
- Витрина и чек читают название через `pickLocale()` из
  `apps/web/lib/locale-text.ts`: kk/en, если заполнено, иначе ru.
- `shops.name` — одно поле на все языки, в отличие от товаров и категорий.
- Комментарии над таблицами в `apps/web/db/schema.ts` — источник правды по
  смыслу полей. Таблицы `users`, `accounts`, `sessions`, `verificationTokens`
  принадлежат `@auth/d1-adapter`: их имена и типы не переименовывать, включая
  `oauth_token` — без него Google-вход падает с `D1_ERROR`.

## Биндинги Cloudflare — только в рантайме

- `DB` (D1), `SHOP_IMAGES` (R2) и `AI_SERVICE` не существуют во время сборки.
  `env` берётся через `getCloudflareContext()` внутри функции:
  `apps/web/db/index.ts`, `apps/web/auth.ts`, `app/api/images/[...key]/route.ts`,
  `app/api/dashboard/photos/route.ts`, `app/api/dashboard/translate/route.ts`.
- Drizzle-клиент создаётся функцией `getDb()`, а не константой уровня модуля;
  конфиг NextAuth — ленивым колбэком по той же причине.
- Провайдеры в `apps/web/auth.ts` подключаются условно, по наличию секретов:
  Google с пустыми credentials роняет весь auth-модуль с «Configuration error».
- Секреты: локально `apps/web/.dev.vars` (шаблон — `.dev.vars.example`),
  на воркере — `wrangler secret put`. Новую env-переменную заводи сразу в обоих
  местах.

## Фото

- Бакет не публичный. Ключи имеют вид `shops/<slug>/products/<productId>.<ext>`,
  отдача — только через `app/api/images/[...key]`, где проверяются префикс
  `shops/` и `..`. В БД лежит ключ (`photo_r2_key`, `logo_r2_key`), не URL.
- Лимиты и хелперы — `apps/web/lib/r2.ts`: 2 МБ, jpeg / png / webp.

## Заказ и WhatsApp

- `orders.items_json` — снапшот позиций `[{productId, name, qty, priceTiyin}]`
  на момент заказа, поэтому переименование товара не меняет прошлые заказы.
- Заказ пишется в БД до редиректа в WhatsApp (ADR-0002). Отсюда «пустые»
  заказы: продавец закрывает их статусом `cancelled`.
- Номер магазина — E.164 без плюса (`77011234567`). Текст чека обрезан лимитом
  `WA_TEXT_LIMIT` в `apps/web/lib/whatsapp.ts`.
- Статусы заказа: `new | accepted | done | cancelled`.

## Тесты

- Vitest живёт только в `apps/ai`: `apps/ai/test/*.test.ts`, запуск
  `pnpm --filter takestart-ai test`.
- В `apps/web` тестов нет, корневого `test`-скрипта тоже нет. Прежде чем
  пообещать тест под веб-фичу, договорись, где он будет жить.
