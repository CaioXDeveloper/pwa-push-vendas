import { API_ROUTES, DEFAULT_NOTIFICATION } from './constants.js';
import { base64ToUint8Array } from './utils.js';

export const createPushService = () => {
  const hasSupport = () => (
    'serviceWorker' in navigator
    && 'Notification' in window
    && 'PushManager' in window
  );

  const getPublicConfig = async () => {
    const response = await fetch(API_ROUTES.publicConfig);
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
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return registration;
  };

  const getExistingSubscription = registration => registration.pushManager.getSubscription();

  const saveSubscription = async subscription => {
    const response = await fetch(API_ROUTES.subscribe, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    if (!response.ok) {
      throw new Error('Não foi possível registrar a inscrição no servidor');
    }
  };

  const removeSubscription = async endpoint => {
    await fetch(API_ROUTES.unsubscribe, {
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

  const subscribe = async (registration, vapidPublicKey) => {
    if (!window.isSecureContext) {
      throw new Error('Push notifications exigem contexto seguro (HTTPS ou localhost)');
    }

    const permission = await requestPermission();
    if (permission !== 'granted') {
      throw new Error('Permissão de notificação não concedida');
    }

    const current = await registration.pushManager.getSubscription();
    if (current) {
      await current.unsubscribe();
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(vapidPublicKey)
    });

    await saveSubscription(subscription);
    return subscription;
  };

  const unsubscribe = async registration => {
    const current = await registration.pushManager.getSubscription();
    if (!current) {
      return null;
    }

    const endpoint = current.endpoint;
    await current.unsubscribe();
    await removeSubscription(endpoint);
    return endpoint;
  };

  const sendLocalTest = async (registration, title, message) => {
    await registration.showNotification(title || DEFAULT_NOTIFICATION.title, {
      body: message || DEFAULT_NOTIFICATION.message,
      tag: 'local-test-notification',
      icon: DEFAULT_NOTIFICATION.icon
    });
  };

  const showSubscriptionSuccess = registration => registration.showNotification(DEFAULT_NOTIFICATION.successTitle, {
    body: DEFAULT_NOTIFICATION.successMessage,
    tag: 'subscription-success',
    icon: DEFAULT_NOTIFICATION.icon
  });

  return {
    hasSupport,
    registerServiceWorker,
    getExistingSubscription,
    subscribe,
    unsubscribe,
    getPublicConfig,
    sendLocalTest,
    showSubscriptionSuccess
  };
};
