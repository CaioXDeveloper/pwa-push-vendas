# PWA Notificações

Repositório: https://github.com/CaioXDeveloper/pwa-push-vendas.git

Aplicação PWA com backend em Node.js para registrar assinaturas Web Push e disparar notificações de vendas.

---

## 🇧🇷 PT-BR

## Créditos e autorização

Este projeto partiu de uma base pré-existente, utilizada com autorização do autor original. A partir dessa base, foi realizada uma refatoração completa com melhorias de arquitetura, interface, performance e organização do código.

## Stack

- Node.js + Express
- Web Push (`web-push`)
- Service Worker
- Frontend estático (HTML/CSS/JS)

## Estrutura

```text
.
├─ public/
│  ├─ css/
│  │  └─ styles.css
│  ├─ js/
│  │  ├─ modules/
│  │  │  ├─ app-controller.js
│  │  │  ├─ constants.js
│  │  │  ├─ dom.js
│  │  │  ├─ event-bus.js
│  │  │  ├─ push-service.js
│  │  │  ├─ ui-controller.js
│  │  │  └─ utils.js
│  │  └─ main.js
│  ├─ index.html
│  ├─ manifest.json
│  └─ sw.js
├─ src/
│  └─ api/
│     └─ server.js
├─ .env.example
├─ package.json
└─ server.js
```

## Configuração

1. Instale dependências:

```bash
npm install
```

2. Gere chaves VAPID:

```bash
npm run generate-vapid
```

3. Crie `.env` a partir de `.env.example` e preencha os valores.

4. Inicie a aplicação:

```bash
npm start
```

Acesse em `http://localhost:3000`.

## Variáveis de ambiente

| Variável | Obrigatória | Exemplo |
| --- | --- | --- |
| `PORT` | não | `3000` |
| `BODY_LIMIT` | não | `1mb` |
| `VAPID_SUBJECT` | sim | `mailto:you@example.com` |
| `VAPID_PUBLIC_KEY` | sim | `B...` |
| `VAPID_PRIVATE_KEY` | sim | `...` |

## Endpoints

- `GET /api/public-config` retorna configuração pública de push
- `POST /api/subscribe` registra assinatura
- `POST /api/unsubscribe` remove assinatura
- `GET /api/subscriptions` lista assinaturas resumidas
- `POST /api/send-notification` envia notificação para todas as assinaturas
- `POST /api/notify-sale` envia notificação formatada de venda
- `GET /api/health` status da aplicação

## Payload de envio

`POST /api/send-notification`

```json
{
  "title": "Nova venda",
  "message": "Você recebeu R$ 150",
  "icon": "📢",
  "tag": "sale",
  "url": "/"
}
```

## Produção

- Use HTTPS obrigatório para Web Push fora de `localhost`
- Persista assinaturas em banco de dados
- Não publique `.env` no repositório
- Configure monitoramento e rate limit

---

## 🇺🇸 EN

## Overview

This project is a PWA with a Node.js backend to manage Web Push subscriptions and send sales notification events.

## Credits and authorization

This repository started from a pre-existing codebase used with authorization from the original owner. It was fully refactored and improved in architecture, UI, performance, and code organization.

## Stack

- Node.js + Express
- Web Push (`web-push`)
- Service Worker
- Static frontend (HTML/CSS/JS)

## Structure

```text
.
├─ public/
│  ├─ css/
│  │  └─ styles.css
│  ├─ js/
│  │  ├─ modules/
│  │  │  ├─ app-controller.js
│  │  │  ├─ constants.js
│  │  │  ├─ dom.js
│  │  │  ├─ event-bus.js
│  │  │  ├─ push-service.js
│  │  │  ├─ ui-controller.js
│  │  │  └─ utils.js
│  │  └─ main.js
│  ├─ index.html
│  ├─ manifest.json
│  └─ sw.js
├─ src/
│  └─ api/
│     └─ server.js
├─ .env.example
├─ package.json
└─ server.js
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Generate VAPID keys:

```bash
npm run generate-vapid
```

3. Create `.env` from `.env.example` and fill values.

4. Start server:

```bash
npm start
```

Open `http://localhost:3000`.

## Environment variables

| Variable | Required | Example |
| --- | --- | --- |
| `PORT` | no | `3000` |
| `BODY_LIMIT` | no | `1mb` |
| `VAPID_SUBJECT` | yes | `mailto:you@example.com` |
| `VAPID_PUBLIC_KEY` | yes | `B...` |
| `VAPID_PRIVATE_KEY` | yes | `...` |

## Endpoints

- `GET /api/public-config` returns public push config
- `POST /api/subscribe` registers subscription
- `POST /api/unsubscribe` removes subscription
- `GET /api/subscriptions` returns summarized subscriptions
- `POST /api/send-notification` sends notification to all subscriptions
- `POST /api/notify-sale` sends formatted sale notification
- `GET /api/health` service health status

## Production notes

- Use HTTPS outside `localhost`
- Persist subscriptions in a database
- Do not commit `.env`
- Add monitoring and rate limiting
