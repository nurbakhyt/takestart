# План деплоя: kaspi-pos-automation на VPS → pay.takestart.cc

Пилот. Решения — `docs/adr/0005-kaspi-pay-vps.md`, исследование — `docs/research/kaspi-pos-automation.md`, карта — issue #46 (дети #47–#53).

VPS: Ubuntu 24.04, 4 vCPU / 8 GB RAM, IP `13.140.153.208`, цель `pay.takestart.cc`.

## System design (почему влезет)

- Caddy (443, авто-TLS) → N × `node server.js` (Express). RSS инстанса ~100–150 МБ;
  8 ГБ хватает на ~30–40 продавцов с запасом. CPU почти idle: поллинг 3 с идёт
  только по активным (отслеживаемым) платежам, HMAC — копейки.
- Данные строго разделены: `/opt/kaspi-pay/instances/<sellerId>/`:
  `.env`, `device.json`, `keypair.json`, `ecdh-keypair.json`, `webhooks.json`,
  `tracked-payments.json`, `webhook-retries.json`, `logs/`. Порты с 3101 вверх,
  маппинг `sellerId → порт` — в `/opt/kaspi-pay/ports.env` (или Caddyfile).
- Поток: витрина → Workers (`D1: Order + Payment`) → инстанс продавца → Kaspi API.
  Обратно: поллинг инстанса 3 с → webhook (HMAC) → Workers-приёмник → D1.
- Лимит пилота: первые 1–3 продавца — ручной онбординг по §3. Селф-сервис (#49)
  — следующим шагом, не в день деплоя.

## 0. DNS (до SSH)

- A-запись `pay.takestart.cc → 13.140.153.208`. Проверить: `dig +short pay.takestart.cc`.

## 1. Base VPS (issue #47)

```bash
ssh root@13.140.153.208   # или выданный пользователь
apt update && apt install -y caddy nodejs npm ufw  # Node ≥ 20.6 (если в репо Ubuntu старый — NodeSource)
node -v  # ≥20.6
useradd -m -s /bin/bash kaspi-pay
mkdir -p /opt/kaspi-pay/instances && chown -R kaspi-pay:kaspi-pay /opt/kaspi-pay
ufw allow 22,80,443/tcp && ufw enable
```

Caddy минимум (`/etc/caddy/Caddyfile`): сайт `pay.takestart.cc` с `reverse_proxy`
заглушкой; TLS — авто. Роуты `/s/*` добавим в §2.

## 2. Апстрим + layout (issue #48)

```bash
su - kaspi-pay
cd /opt/kaspi-pay
git clone https://github.com/tapter-dev/kaspi-pos-automation.git upstream
cd upstream && npm install --omit=dev && git rev-parse HEAD  # записать пин коммита в ports.env
```

- На продавца: `instances/<sellerId>/` + порт (3101, 3102, …), `.env`:
  `TOKEN_SECRET_KEY=$(openssl rand -hex 32)`, `PORT=<порт>`.
- `webhooks.json` инстанса: `[{url: "https://takestart.cc/api/payments/webhook", events: [...], secret: "<сгенерировать>"}]`
  (точный path приёмника — из #52; secret хранить только на VPS + в env Workers).
- systemd-шаблон `/etc/systemd/system/kaspi-pay@.service`:
  `User=kaspi-pay`, `WorkingDirectory=/opt/kaspi-pay/upstream`,
  `EnvironmentFile=/opt/kaspi-pay/instances/%i/.env`,
  `ExecStart=/usr/bin/node server.js` (+ `DATA_DIR`-переопределение, если патчим апстрим
  под per-seller папки; иначе — копия `upstream/` на продавца или `StateDirectory=`).
  ⚠️ Апстрим пишет файлы в корень репо — запускать два инстанса из одного каталога
  нельзя (перетрут `device.json`/`tracked-payments.json`). На пилот: копия каталога
  на продавца (`instances/<sellerId>/app/`) — проще и честнее, чем патчить пути.
- Caddy: `/s/<sellerId>/api/* → localhost:<порт>` с `uri strip_prefix /s/<sellerId>`,
  плюс `/s/<sellerId>/health`. `public/` апстрима наружу не отдавать (только `/api`, `/health`).

## 3. Первый продавец вручную (пилот, до #49)

1. `mkdir instances/<sellerId>/app`, копия апстрима, `.env`, `webhooks.json`.
2. `systemctl enable --now kaspi-pay@<sellerId>`, проверить `/health` через Caddy.
3. Auth: `POST /s/<sellerId>/api/auth/init` → `send-phone {phoneNumber: 7...}`
   → продавец диктует SMS → `verify-otp {otp}` → получить `tokenSN/vtokenSecret`.
   ⚠️ Кассир после этого не входит тем же аккаунтом с телефона (иначе вытеснение сессии, `payment.lost`).
4. E2E на мелкой сумме: `qr/create {amount}` → показать QR из `QrOriginalToken`
   → оплатить → дождаться `payment.success` на приёмнике → сверить `history/operations`.
   Межбанк: сканировать `QrOriginalToken` не-Kaspi приложением.
5. Тест вытеснения: вход с телефона → ожидаем `payment.lost`, фиксируем UX.

## 4. Дальше по карте

- #50 домен+D1 (`Payment`, `Order.paid`, миграция `--remote` вручную из `apps/web`).
- #51 QR-чекаут витрины (серверный вызов, секреты не в браузере).
- #49 селф-сервис онбординг (прокси auth по `sellerId` из кабинета).
- #52 приёмник вебхуков (HMAC, идемпотентность, сверка).
- #53 харденинг: приглушить `loggedFetch`, бэкап `instances/` (cron + offsite),
  мониторинг `OldVersionToUpdate`, regen-ранбук.

## Откат

- `systemctl stop kaspi-pay@<sellerId>`; Caddy-роут убрать `caddy reload`.
  Заказы продолжают уходить в WhatsApp как раньше (оплата — опциональный слой).
- Потеря `TOKEN_SECRET_KEY` = перевыпуск сессии через OTP заново (история трекинга в файле сохранится, секреты — нет).
