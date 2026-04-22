const path = require('path');
const express = require('express');
const webpush = require('web-push');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const subscriptions = new Map();

const port = Number(process.env.PORT || 3000);
const bodyLimit = process.env.BODY_LIMIT || '1mb';
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
const publicPath = path.join(__dirname, '..', '..', 'public');

if (!vapidPublicKey || !vapidPrivateKey) {
  throw new Error('VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY são obrigatórias no arquivo .env');
}

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

app.use(express.json({ limit: bodyLimit }));
app.use(express.static(publicPath));

const normalizeSubscription = payload => {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const endpoint = typeof payload.endpoint === 'string' ? payload.endpoint.trim() : '';
  const keys = payload.keys && typeof payload.keys === 'object' ? payload.keys : null;
  const p256dh = keys && typeof keys.p256dh === 'string' ? keys.p256dh.trim() : '';
  const auth = keys && typeof keys.auth === 'string' ? keys.auth.trim() : '';

  if (!endpoint || !p256dh || !auth) {
    return null;
  }

  return {
    endpoint,
    expirationTime: payload.expirationTime ?? null,
    keys: { p256dh, auth }
  };
};

const buildPayload = data => JSON.stringify({
  title: data.title || 'Nova notificação',
  message: data.message || 'Você tem uma nova atualização',
  icon: data.icon || '📢',
  tag: data.tag || 'default-notification',
  url: data.url || '/'
});

const removeSubscription = endpoint => {
  subscriptions.delete(endpoint);
};

const sendPushToAll = async payload => {
  const currentSubscriptions = [...subscriptions.values()];
  const results = await Promise.allSettled(
    currentSubscriptions.map(subscription => webpush.sendNotification(subscription, payload))
  );

  let sent = 0;
  let failed = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      sent += 1;
      return;
    }

    failed += 1;
    const statusCode = result.reason?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      removeSubscription(currentSubscriptions[index].endpoint);
    }
  });

  return { sent, failed, total: currentSubscriptions.length };
};

app.get('/api/public-config', (req, res) => {
  res.status(200).json({ vapidPublicKey });
});

app.post('/api/subscribe', (req, res) => {
  const subscription = normalizeSubscription(req.body);
  if (!subscription) {
    return res.status(400).json({ error: 'Payload de subscrição inválido' });
  }

  subscriptions.set(subscription.endpoint, subscription);
  return res.status(201).json({ message: 'Inscrição registrada', total: subscriptions.size });
});

app.post('/api/unsubscribe', (req, res) => {
  const endpoint = typeof req.body?.endpoint === 'string' ? req.body.endpoint : '';
  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint é obrigatório' });
  }

  const removed = subscriptions.delete(endpoint);
  return res.status(200).json({ message: removed ? 'Inscrição removida' : 'Inscrição não encontrada', total: subscriptions.size });
});

app.get('/api/subscriptions', (req, res) => {
  const list = [...subscriptions.values()].map((item, index) => ({
    id: index,
    endpoint: `${item.endpoint.slice(0, 48)}...`
  }));

  return res.status(200).json({ total: subscriptions.size, subscriptions: list });
});

app.post('/api/send-notification', async (req, res) => {
  const { title, message, icon, tag, url } = req.body || {};
  if (!title || !message) {
    return res.status(400).json({ error: 'title e message são obrigatórios' });
  }

  const payload = buildPayload({ title, message, icon, tag, url });
  const result = await sendPushToAll(payload);
  return res.status(200).json({ message: 'Envio concluído', ...result });
});

app.post('/api/notify-sale', async (req, res) => {
  const { product, amount, customer } = req.body || {};
  if (!product || typeof amount === 'undefined') {
    return res.status(400).json({ error: 'product e amount são obrigatórios' });
  }

  const payload = buildPayload({
    title: 'Nova venda confirmada',
    message: `${product} vendido por R$${amount} para ${customer || 'Cliente'}`,
    tag: 'sale-notification'
  });

  const result = await sendPushToAll(payload);
  return res.status(200).json({ message: 'Notificação de venda enviada', ...result });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    subscriptions: subscriptions.size,
    timestamp: new Date().toISOString()
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(port, () => {
  // Adicionar "console.clear()" depois, e apagar este comentario.
  console.clear();
  console.log(`Servidor ativo em http://localhost:${port}`);
});
