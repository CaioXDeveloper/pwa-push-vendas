const state = {
  registration: null,
  subscription: null,
  vapidPublicKey: null
};

const notificationIcon = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%230b1220' width='192' height='192'/><rect fill='%234f9dff' x='20' y='20' width='152' height='152' rx='28'/><text x='96' y='106' font-size='76' fill='white' text-anchor='middle' dominant-baseline='middle' font-family='Arial'>🔔</text></svg>";

const elements = {
  statusDot: document.getElementById('statusDot'),
  statusText: document.getElementById('statusText'),
  subscribeBtn: document.getElementById('subscribeBtn'),
  unsubscribeBtn: document.getElementById('unsubscribeBtn'),
  testForm: document.getElementById('testForm'),
  titleInput: document.getElementById('titleInput'),
  messageInput: document.getElementById('messageInput'),
  logBox: document.getElementById('logBox')
};

const setStatus = (text, active) => {
  elements.statusText.textContent = text;
  elements.statusDot.classList.toggle('active', active);
  elements.statusDot.classList.toggle('inactive', !active);
};

const log = message => {
  const line = document.createElement('div');
  line.className = 'log-line';
  line.textContent = `[${new Date().toLocaleTimeString('pt-BR')}] ${message}`;
  elements.logBox.prepend(line);
  if (elements.logBox.childElementCount > 30) {
    elements.logBox.removeChild(elements.logBox.lastElementChild);
  }
};

const base64ToUint8Array = base64 => {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    bytes[i] = raw.charCodeAt(i);
  }
  return bytes;
};

const hasSupport = () => {
  if (!('serviceWorker' in navigator)) return false;
  if (!('Notification' in window)) return false;
  if (!('PushManager' in window)) return false;
  return true;
};

const updateUI = () => {
  const subscribed = Boolean(state.subscription);
  elements.subscribeBtn.classList.toggle('hidden', subscribed);
  elements.unsubscribeBtn.classList.toggle('hidden', !subscribed);
  setStatus(subscribed ? 'Inscrito em notificações push' : 'Não inscrito', subscribed);
};

const saveSubscription = async subscription => {
  const response = await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });

  if (!response.ok) {
    throw new Error('Não foi possível registrar a inscrição no servidor');
  }
};

const removeSubscription = async endpoint => {
  await fetch('/api/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint })
  });
};

const requestPermission = async () => {
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
};

const getPublicConfig = async () => {
  const response = await fetch('/api/public-config');
  if (!response.ok) {
    throw new Error('Falha ao carregar configuração pública');
  }
  const data = await response.json();
  if (!data.vapidPublicKey) {
    throw new Error('VAPID public key não disponível');
  }
  return data.vapidPublicKey;
};

const registerServiceWorker = async () => {
  state.registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  await navigator.serviceWorker.ready;
  log('Service Worker registrado com sucesso');
};

const syncSubscription = async () => {
  state.subscription = await state.registration.pushManager.getSubscription();
  updateUI();
};

const subscribe = async () => {
  if (!window.isSecureContext) {
    throw new Error('Push notifications exigem contexto seguro (HTTPS ou localhost)');
  }

  const permission = await requestPermission();
  if (permission !== 'granted') {
    throw new Error('Permissão de notificação não concedida');
  }

  if (!state.vapidPublicKey) {
    state.vapidPublicKey = await getPublicConfig();
  }

  const current = await state.registration.pushManager.getSubscription();
  if (current) {
    await current.unsubscribe();
  }

  state.subscription = await state.registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64ToUint8Array(state.vapidPublicKey)
  });

  await saveSubscription(state.subscription);
  await syncSubscription();
  log('Inscrição push criada');

  await state.registration.showNotification('Inscrição ativa', {
    body: 'Notificações habilitadas com sucesso',
    tag: 'subscription-success',
    icon: notificationIcon
  });
};

const unsubscribe = async () => {
  const subscription = await state.registration.pushManager.getSubscription();
  if (!subscription) {
    state.subscription = null;
    updateUI();
    return;
  }

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  await removeSubscription(endpoint);

  state.subscription = null;
  updateUI();
  log('Inscrição removida');
};

const sendLocalTest = async title => {
  if (!state.registration) return;
  await state.registration.showNotification(title, {
    body: elements.messageInput.value.trim(),
    tag: 'local-test-notification',
    icon: notificationIcon
  });
};

const onTestSubmit = async event => {
  event.preventDefault();

  if (!state.subscription) {
    log('Ative a inscrição antes de enviar teste');
    return;
  }

  const title = elements.titleInput.value.trim() || 'Nova notificação';
  await sendLocalTest(title);
  log('Notificação local enviada');
};

const init = async () => {
  elements.subscribeBtn.addEventListener('click', async () => {
    try {
      await subscribe();
    } catch (error) {
      log(error.message);
      setStatus('Falha ao inscrever', false);
    }
  });

  elements.unsubscribeBtn.addEventListener('click', async () => {
    try {
      await unsubscribe();
    } catch (error) {
      log(error.message);
    }
  });

  elements.testForm.addEventListener('submit', async event => {
    try {
      await onTestSubmit(event);
    } catch (error) {
      log(error.message);
    }
  });

  if (!hasSupport()) {
    setStatus('Navegador sem suporte completo para Push API', false);
    log('Service Worker, Notification API ou PushManager indisponíveis');
    return;
  }

  try {
    setStatus('Registrando Service Worker...', false);
    await registerServiceWorker();
    await syncSubscription();
    setStatus(state.subscription ? 'Inscrito em notificações push' : 'Pronto para inscrição', Boolean(state.subscription));
    log('Aplicação inicializada');
  } catch (error) {
    setStatus('Erro ao inicializar', false);
    log(error.message);
  }
};

init();
