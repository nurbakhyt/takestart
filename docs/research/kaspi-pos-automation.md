# Исследование: tapter-dev/kaspi-pos-automation как платёжный бэкенд TakeStart

Дата: 2026-10-06.
Язык: русский (имена endpoints, полей и файлов — в оригинале).

> Все факты о репозитории ниже — по первичным источникам: код и доки самого
> репозитория (склонен 2026-10-06 через загрузку GitHub). Официальной публичной
> документации Kaspi под эти endpoints нет — это реверс-инжиниринг мобильного
> клиента Kaspi Pay, что само по себе главный риск (см. «Риски»).
> Локальный контекст TakeStart — `README.md`, `CONTEXT.md`, `apps/web/app/api/orders`.

## Источники

Первичные (репозиторий, читался код целиком):

- <https://github.com/tapter-dev/kaspi-pos-automation> — README: назначение,
  архитектура, быстрый старт, демо-UI, единый QR.
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/docs/API.md> —
  полный REST-контракт (auth/invoice/QR/history/refund/session/webhooks).
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/server.js> —
  точка входа: Express, `/api/*`, статика `public/`, `startPolling()`.
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/src/config.js> —
  апстрим-домены Kaspi, device identity, `APP_*`-константы, комментарий про
  `OldVersionToUpdate`.
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/src/crypto.js> —
  ECDSA/ECDH, TOTP, AES-256-GCM для `vtokenSecret`, требование
  `TOKEN_SECRET_KEY`.
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/src/helpers.js> —
  `entranceCookie`, `signedQrPayHeaders`, `loggedFetch`.
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/src/session.js> —
  поля сессии, `applyOrgContext`.
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/src/routes/auth.js> —
  3-шаговый SMS-flow через `entrance-pay.kaspi.kz/api/v1/entrance/step`.
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/src/routes/qr.js> —
  `POST /api/qr/create`, `GET /api/qr/status`, подмена
  `QrToken`/`QrOriginalToken`, `trackPayment`.
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/src/routes/invoice.js> —
  счета по номеру телефона (`/v01/remote/*`).
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/src/routes/refund.js> —
  возврат (`/v01/kaspi-qr/history-pos-return`).
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/src/polling.js> —
  поллинг 3 сек, `tracked-payments.json`, маппинг статусов, вебхуки, ретраи.
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/src/webhookStore.js> —
  чтение `webhooks.json`.
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/package.json> —
  `kaspi-pos-automation@1.0.0`, Node `>=20.6.0`, зависимости
  `express`/`dotenv`/`node-fetch`, скрипты `regen:keypair`/`regen:device`.
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/.env.example> —
  `TOKEN_SECRET_KEY`, `PORT`, `APP_*`.
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/webhooks.example.json> —
  формат подписки на события.
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/AGENTS.md> —
  stateless-после-авторизации, временный in-memory `Map` только на время
  SMS-flow.
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/CHANGELOG.md> —
  `1.0.0 — 2025-05-09`, стартовый релиз.
- <https://github.com/tapter-dev/kaspi-pos-automation/blob/main/LICENSE> —
  MIT, copyright 2025 tapter.one.

Локальные (TakeStart):

- `README.md` — `apps/web` (Next.js App Router edge + OpenNext/Workers,
  D1/Drizzle + R2, Auth.js v5, next-intl ru/kk/en), `apps/ai`.
- `CONTEXT.md` — Shop/Seller/Buyer/Cart/Order/WhatsApp Handoff.
- `apps/web/app/api/orders` — создание заказа + `wa.me`-ссылка.

## Резюме

`kaspi-pos-automation` — это Express-сервер, притворяющийся мобильным клиентом
Kaspi Pay (iPhone) и говорящий с приватными endpoints Kaspi
(`entrance-pay.kaspi.kz`, `mtoken.kaspi.kz`, `qrpay.kaspi.kz`). Даёт REST для:
SMS-авторизации под номером кассира, выставления счёта по номеру телефона,
генерации QR (Kaspi + Единый QR для других банков), истории, возвратов и
проверки сессии. Плюс фоновый поллинг статусов каждые 3 сек с исходящими
вебхуками `payment.success/failed/expired/lost` (HMAC SHA-256, 3 ретрая).
Источник: README, `docs/API.md`, `src/polling.js`.

Для нашего сценария («VPS крутит этот сервер, UI — на `takestart.cc`»)
технически подходит: это ровно тот зазор, который проект закрывает —
официального merchant-API для приёма Kaspi-оплат малым бизнесом нет, поэтому
автор эмулирует клиент. Но это неофициальная интеграция со всеми
вытекающими: бан аккаунта/точки, вытеснение сессии при входе с другого
устройства (`StatusCode -101001` → `payment.lost`), ломка логина при каждом
поднятии минимальной версии приложения Kaspi (`OldVersionToUpdate`), один
кассир = одна точка отказа, секреты сессий хранятся у вызывающей стороны.
Источник: `src/config.js` (комментарий про версии), `src/polling.js`
(ветка `-101001`), `src/routes/*` (сессия в заголовках).

Вывод: годится как пилот для своих/лояльных продавцов (1 VPS = 1 дежурная
сессия кассира, вебхук дёргает TakeStart), но не как общий мультитенант-сервис
«подключи свой Kaspi» без доработки изоляции, биллинга рисков и юр. оценки.

## Находки

### 1. Что делает, архитектура

- Схема: `Web UI (public/) ↔ Express (server.js) ↔ Kaspi Pay API
  (entrance/mtoken/qrpay)`, внутри `src/config|crypto|helpers|session|logger|
  polling|webhookStore`, роуты `auth|invoice|qr|history|refund|session`.
  Источник: README (блок «Архитектура»), `server.js`.
- Сервер **stateless после авторизации**: расшифрованный `vtokenSecret`,
  `tokenSN`, `profileId` хранятся на стороне клиента и приезжают заголовками
  `X-Token-SN` / `X-Vtoken-Secret` / `X-Profile-Id` (последний опционален).
  В памяти (`Map`) живут только незавершённые SMS-flow (`processId`).
  Источник: README, `AGENTS.md`, `src/routes/qr.js` (`extractSession`,
  `requireAuth`).
- Демо-UI (`public/index.html` + `public/app.js`) — авторизация, счёт, QR,
  история, возвраты — «для демонстрации и тестирования API. Для продакшена
  рекомендуется использовать собственный фронтенд». То есть наш UI на
  `takestart.cc` — штатный путь, а не хак. Источник: README (раздел
  «Демо-интерфейс»).
- Зависимостей мало: `express`, `dotenv`, `node-fetch`; dev — `eslint`,
  `prettier`. Тесты: `node --test test/**`. Источник: `package.json`.

### 2. Как говорит с Kaspi (неофициально)

- Домены захардкожены: `KASPI_ENTRANCE_URL =
  https://entrance-pay.kaspi.kz`, `KASPI_MTOKEN_URL =
  https://mtoken.kaspi.kz`, `KASPI_QRPAY_URL = https://qrpay.kaspi.kz`.
  Источник: `src/config.js`.
- Auth идёт через `POST {entrance}/api/v1/entrance/step` с кукой
  `deviceId/installId/pk/pkTag/...` и `Referer` на процесс entrance.
  Источник: `src/routes/auth.js`, `src/helpers.js` (`entranceCookie`).
- Подпись запросов в QRPay: `X-Kb-TokenSn`, `X-Kb-TokenSnMac`, `X-PI`,
  `X-Install-ID`, `X-Device-ID`, `X-App-Ver/Bld`, `X-Time`, `X-SH`, `X-Sign`
  (`computeTokenSnMac`/`computeXSign`). Источник: `src/helpers.js`
  (`signedQrPayHeaders`).
- Крипта: ECDSA P-256 (`keypair.json`), ECDH (`ecdh-keypair.json`), TOTP
  `OCRA-1:HOTP-SHA256-6:QH64-T1M`, шифрование `vtokenSecret` — AES-256-GCM
  ключом `TOKEN_SECRET_KEY` (формат `iv|tag|ciphertext`, base64).
  Источник: `src/crypto.js`, `src/config.js`.
- Маскировка под клиент: `APP_*` (по умолчанию iPhone, `26.0921/1115`,
  `CFNetwork`, `Darwin`), `User-Agent` двух видов. Kaspi валидирует эти
  значения и режет неизвестные. Источник: `src/config.js`, `.env.example`.

### 3. Требования и запуск на VPS

- Node.js `>= 20.6` (ES-модули). Источник: `package.json`, README, `AGENTS.md`.
- Физический терминал/ADB/root **не нужны** — нужен только номер кассира
  Kaspi Pay, принимающий SMS. Вход — с эмулированного «айфона».
  Источник: `docs/API.md` («используйте номер телефона аккаунта кассира»),
  `src/routes/auth.js`.
- Старт: `npm install` → `.env` с `TOKEN_SECRET_KEY=$(openssl rand -hex 32)`
  (без него — `FATAL` и выход) → опционально `webhooks.json` → `npm start`
  (`http://localhost:3000`, `GET /health → {status:ok}`). При первом старте
  создаются `keypair.json` + `device.json` (оба в `.gitignore`, в прод не
  коммитить). Источник: README, `src/crypto.js`, `src/config.js`, `server.js`.
- Ротация: `npm run regen:keypair` / `npm run regen:device` (старые — в
  `.bak`, сессии после ротации недействительны). Источник: README, `package.json`.
- Что хранить/бэкапить на VPS: `.env` (`TOKEN_SECRET_KEY`!), `keypair.json`,
  `device.json`, `ecdh-keypair.json`, `webhooks.json`, `tracked-payments.json`,
  `webhook-retries.json`, логи. Потеря `TOKEN_SECRET_KEY` = потеря всех
  выданных `vtokenSecret` (расшифровать нечем). Источник: `src/crypto.js`
  (`decryptSecret`), `src/polling.js` (персист трекинга/ретраев).
- Порт по умолчанию `3000`, меняется `PORT`. За VPS нужен reverse proxy
  (TLS), systemd-юнит и firewall — в репо этого нет (только Express).
  Источник: `src/config.js`, `server.js`.

### 4. REST-контракт, нужный TakeStart

- Auth (3 шага): `POST /api/auth/init → {processId}` →
  `POST /api/auth/send-phone {phoneNumber: 7XXXXXXXXXX, processId}` →
  `POST /api/auth/verify-otp {otp, processId} →
  {tokenSN, vtokenSecret, profileId, organizationId, orgName, ...}`.
  `tokenSN`+`vtokenSecret` — хранить на бэкенде TakeStart (зашифрованно), никогда
  не отдавать в браузер покупателя. Источник: `docs/API.md`, `src/routes/auth.js`.
- Сессия: `GET /api/session/check` (`{active:true/false}`),
  `POST /api/auth/session`, `POST /api/auth/logout`. Источник: `docs/API.md`.
- QR (основной сценарий витрины): `POST /api/qr/create {amount, latitude?,
  longitude?}` → `Data.{QrOperationId, QrToken, ExpireDate, Amount,
  ReceiptUrl}`; статус — `GET /api/qr/status?qrOperationId=`.
  Важно: сервер подменяет `QrToken`: в `QrOriginalToken` кладёт исходный
  `https://qr.kaspi.kz/...` (Единый QR — оплата приложениями других банков),
  а в `QrToken` — `https://pay.kaspi.kz/pay/...` (только Kaspi). Для
  межбанка рисовать QR из `QrOriginalToken`. Источник: README («Единый QR»),
  `docs/API.md`, `src/routes/qr.js`.
- Счёт по номеру (альтернатива QR): `GET /api/invoice/client-info`,
  `POST /api/invoice/create {phoneNumber, amount, comment?}`,
  `GET /api/invoice/details?operationId=`, `POST /api/invoice/cancel`,
  `POST /api/invoice/history`. Источник: `docs/API.md`, `src/routes/invoice.js`.
- История: `POST /api/history/operations {endDate, lastTransactionDate?,
  statementPeriodCode?}`, `POST /api/history/details {id}`.
  Возврат: `POST /api/refund/create {qrOperationId, returnAmount}`.
  Источник: `docs/API.md`, `src/routes/refund.js`.
- Ошибки — `{error}`, HTTP `400/401/500`. Источник: `docs/API.md`.

### 5. Вебхуки — точка стыка с TakeStart

- Поллинг: каждые 3 сек (`POLL_MS=3000`, без перекрытий), состояние в
  `tracked-payments.json` (переживает рестарт). Источник: `src/polling.js`.
- События: `payment.success` (QR/invoice `Processed`), `payment.failed`
  (`CancelledByUser/Rejected/Error/...`, `RemotePaymentCanceled/Rejected`),
  `payment.expired` (`QrTokenDiscarded/Expired`), `payment.lost`
  (сессия вытеснена `-101001` или 10 неудачных опросов). Промежуточные
  (`QrTokenCreated/Wait`, `RemotePaymentCreated`) событий не дают.
  Источник: `src/polling.js` (`QR_FINAL_STATUSES`, `INVOICE_FINAL_STATUSES`).
- Payload: `{event, paymentId, type: qr|invoice, status, statusDesc, amount,
  qrToken?, receiptUrl?, orderNumber?, data, timestamp}`.
  Подпись: `X-Webhook-Signature: sha256=<hmac(body, secret)>`.
  Ретраи: до 3 попыток (сразу → 5 сек → 30 сек), таймаут 10 сек, очередь в
  `webhook-retries.json`. Источник: `docs/API.md`, `src/polling.js`.
- Настройка: `webhooks.json` (массив `{url, events[], secret?}`), несколько
  подписчиков с разными событиями — можно. Источник: `webhooks.example.json`,
  `src/webhookStore.js`.
- Для TakeStart это значит: заказ витрины → создать QR/invoice → положить
  `paymentId` в заказ → ждать вебхук на секретный URL воркера → обновить
  статус оплаты и (опционально) уведомить продавца. Прямого «создать заказ в
  TakeStart» в репо нет — стык делаем мы.

### 6. Интеграция с TakeStart (как видится из кода обеих сторон)

- Размещение: VPS с этим сервером за HTTPS (не Workers — нужен долгоживущий
  процесс с файлами и поллингом); `takestart.cc` — только UI + наш
  бэкенд-прокси. Никогда не проксировать `X-Token-SN`/`X-Vtoken-Secret` через
  браузер; браузеру — только картинка QR / статус «ожидаем оплату».
- Поток QR: checkout на витрине → наш `POST /api/orders` создаёт заказ со
  статусом `new` (как сейчас) + серверная сторона TakeStart вызывает
  `POST /api/qr/create` на VPS → витрина показывает QR (`QrOriginalToken`
  для межбанка) → поллинг/вебхук `payment.success` → помечаем заказ
  оплаченным → существующий редирект `wa.me` остаётся как подтверждение
  продавцу. Invoice-поток — запасной (нужен номер телефона покупателя).
- Мультипродавец: из коробки сервер single-tenant (одна дежурная сессия
  кассира, один `device.json`). На N продавцов — либо N инстансов/портов с
  отдельными volume, либо доработка (хранилище сессий по `sellerId`). Второе
  в репо отсутствует. Сессия вытесняется входом с другого устройства —
  кассиру нельзя параллельно сидеть в живом Kaspi Pay на том же аккаунте
  без риска `payment.lost`. Источник: `src/polling.js` (ветка `-101001`),
  `src/config.js` (один `device.json`).
- Что дописать нам: прокси-эндпоинты в `apps/web` (создать QR, статус) с
  серверным хранением секретов; приёмник вебхуков с проверкой HMAC и
  идемпотентностью; привязка `paymentId ↔ orderId`; страница успеха с
  «оплачено/ожидаем»; возвраты — в кабинет продавца.

### 7. Риски и открытые вопросы

- Неофициальный API: ни одного звена к публичной доке Kaspi. Любое обновление
  Kaspi может сломать подпись/куки/версии без предупреждения; в коде уже
  заложен этот дрейф (`APP_VERSION/BUILD` + `OldVersionToUpdate` — «обновляйте
  при выходе новой версии»). Источник: `src/config.js`, `.env.example`.
- ToS/комплаенс: эмуляция клиента и вход под кассиром — почти наверняка вне
  разрешённого использования Kaspi. Возможны блокировка аккаунта, отказ в
  споре по платежу, вопросы НБ РК по приёму платежей. Юридической оценки в
  репо нет (`SECURITY.md` — только про уязвимости самого сервера).
- Операционка: одна сессия на инстанс; SMS-авторизация требует живого доступа
  к номеру кассира при каждом протухании сессии; TTL трекинга — по
  `ExpireDate`; после 10 неудачных опросов — `payment.lost` с ручной проверкой.
  Источник: `src/polling.js`.
- Безопасность: `TOKEN_SECRET_KEY`, `keypair.json`, `device.json`,
  `webhooks.json` (секреты HMAC), логи `loggedFetch` (светят тела запросов
  Kaspi в stdout — на проде приглушить). Секреты сессий (`vtokenSecret`)
  нельзя класть в D1/клиент без шифрования. Источник: `src/helpers.js`
  (`loggedFetch`), `src/crypto.js`, `SECURITY.md`.
- Надёжность денег: `payment.failed` маппит неизвестные статусы в `failed`
  (`QR_FINAL_STATUSES[status] || 'payment.failed'`) — новые коды Kaspi тихо
  станут «фейлами». Сверку с `history/operations` держать обязательной.
  Источник: `src/polling.js` (`resolveEvent`).
- Активность/мейнтейнер: релиз `1.0.0` от 2025-05-09, русско+казахскоязычные
  доки (`README.kk.md`, `docs/API.kk.md`), шаблоны issues/PR, ESLint/Prettier/CI.
  Дальнейшую свежесть (коммиты после релиза, скорость реакции на поднятие
  версий Kaspi) проверить по вкладке commits/issues перед принятием решения —
  в этом исследовании зафиксирован только срез кода.
- Лицензия: MIT (tapter.one, 2025) — использовать/форкать можно, но проверить,
  что в форк не уедут секреты. Источник: `LICENSE`, `package.json`.
- Де-факто статус (со слов владельца, 2026-10-06): Kaspi знает про такие
  интеграции, но официального SDK не даёт — люди пользуются как есть. Это
  смягчает, но не снимает риск п. «ToS/комплаенс»: толерантность сегодня ≠
  гарантия завтра, при споре по деньгам опереться не на что.

## Что проверить руками перед VPS (открытые вопросы)

1. Живой логин номером кассира: проходит ли `init→send-phone→verify-otp` с
   текущими `APP_VERSION=26.0921/BUILD=1115`, нет ли `OldVersionToUpdate`.
2. QR end-to-end на мелкой сумме: `create → status → success`-вебхук на наш
   тестовый URL, HMAC сходится, `QrOriginalToken` сканируется не-Kaspi
   приложением.
3. Вытеснение сессии: что происходит при входе тем же кассиром с телефона
   (ожидаем `payment.lost`), какой UX показываем покупателю.
4. Свежесть апстрима: последние коммиты/issues в репо, как быстро мейнтейнер
   поднимает `APP_*` после релизов Kaspi Pay.
5. Юрист + Kaspi: допустимость такого приёма платежей для наших продавцов,
   кто несёт риск блокировки.
