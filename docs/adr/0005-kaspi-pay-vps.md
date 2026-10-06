# ADR-0005: приём Kaspi-оплат через парк single-tenant инстансов на VPS

Дата: 2026-10-06. Статус: принято (пилот). Контекст — `docs/research/kaspi-pos-automation.md`, карта — issue #46.

Апстрим `tapter-dev/kaspi-pos-automation` (MIT) эмулирует мобильного клиента
Kaspi Pay и из коробки single-tenant: один инстанс = одна дежурная сессия
кассира (свои `device.json`/`keypair.json`, SMS-flow в памяти, `tracked-payments.json`).
Официального merchant-SDK Kaspi нет (де-факто толерантность, не гарантия).

## Решение

1. **1 VPS = парк инстансов**, по процессу на продавца:
   `/opt/kaspi-pay/instances/<sellerId>` со своими `.env`, `device.json`,
   `keypair.json`, `webhooks.json`, `tracked-payments.json`, порты 3101+.
   Переделывать апстрим в мультитенант не будем (отход от апстрима дороже парка процессов).
2. **Роутинг path-based**: `pay.takestart.cc/s/<sellerId>/api/*` → `localhost:30xx`
   (Caddy `strip_prefix`, systemd-юниты `kaspi-pay@<sellerId>`). Один домен, один TLS.
3. **Секреты только на VPS** (`TOKEN_SECRET_KEY`, `tokenSN`/`vtokenSecret`,
   HMAC-секреты). В D1 — только связка `paymentId ↔ orderId ↔ sellerId` и статусы.
   В браузер секреты не уходят никогда.
4. **Онбординг селф-сервис**: продавец вводит номер/OTP в кабинете `takestart.cc`,
   Workers проксируют `auth/init → send-phone → verify-otp` в его инстанс
   (аффинность по `sellerId`; `processId` живёт в памяти инстанса).
5. **Домен**: `Payment` (наш, в D1) — один `Shop` → N `Payment`, один `Order` → 0..1
   `Payment`; `provider: kaspi-qr | kaspi-invoice`; статусы
   `pending | success | failed | expired | lost` (каспевые `Processed`,
   `QrTokenDiscarded`, … — только маппингом). `Order` получает статус `paid`.
   Слово `Transaction` не используем (`CONTEXT.md`).
6. **Демо-UI апстрима (`public/`) на проде закрыт**, `loggedFetch` приглушён —
   иначе светим тела запросов Kaspi и даём OTP в обход кабинета.

## Следствия

- Пилот: 1–3 продавца ручным SSH-онбордингом (#47, #48), дальше селф-сервис (#49).
- Обязательны приёмник вебхуков с HMAC и идемпотентностью (#52) и сверка
  `history/operations` (неизвестные коды Kaspi тихо маппятся в `failed`).
- Бэкап `/opt/kaspi-pay/instances` обязателен: потеря `TOKEN_SECRET_KEY`
  невосстановима (все `vtokenSecret` не расшифровать).
- Дрейф апстрима: следить за `APP_VERSION/BUILD` (`OldVersionToUpdate` ломает
  логин для всех) и держать пин коммита форка.
- Риск блокировки аккаунта продавца — на продавце; говорим это openly до онбординга.
