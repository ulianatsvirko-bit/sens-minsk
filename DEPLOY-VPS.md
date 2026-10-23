# Развёртывание СЭНС на VPS

Подойдёт Ubuntu 22.04/24.04 с доменом, направленным на IP сервера.

## 1. Установка

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

Загрузите проект в `/var/www/sens`, затем:

```bash
cd /var/www/sens
npm ci --omit=dev
cp .env.example .env
nano .env
```

Создать надёжный секрет можно командой `openssl rand -hex 32`. В `.env` обязательно замените `ADMIN_LOGIN`, `ADMIN_PASSWORD` и `SESSION_SECRET`.

Чтобы формы сайта (заявка на аренду и запись на событие) отправлялись в Telegram, заполните `TELEGRAM_BOT_TOKEN` и `TELEGRAM_CHAT_ID`; `TELEGRAM_CHAT_ID_2` — необязательный второй чат для копий. Сервер сам отвечает на `/api/contact` и `/api/register`, Vercel для этого не нужен.

## 2. Запуск

```bash
set -a
source .env
set +a
pm2 start server.js --name sens
pm2 save
pm2 startup
```

Выполните команду, которую выведет `pm2 startup`.

## 3. Nginx и HTTPS

Создайте `/etc/nginx/sites-available/sens`:

```nginx
server {
    listen 80;
    server_name your-domain.by www.your-domain.by;
    client_max_body_size 8M;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/sens /etc/nginx/sites-enabled/sens
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.by -d www.your-domain.by
```

Админ-панель будет на `https://your-domain.by/admin.html`, календарь — на `https://your-domain.by/events.html`.

## Резервные копии

Сохраняйте папки `data/` и `uploads/`. В первой находится база SQLite, во второй — обложки событий.
