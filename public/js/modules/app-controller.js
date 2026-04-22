import { createEventBus } from './event-bus.js';
import { UI_TEXT } from './constants.js';
import { createUiController } from './ui-controller.js';
import { createPushService } from './push-service.js';

export const createAppController = dom => {
  const bus = createEventBus();
  const ui = createUiController(dom);
  const pushService = createPushService();

  const state = {
    registration: null,
    subscription: null,
    vapidPublicKey: null
  };

  const syncSubscription = async () => {
    state.subscription = await pushService.getExistingSubscription(state.registration);
    ui.syncSubscriptionState(Boolean(state.subscription));
  };

  const ensurePublicKey = async () => {
    if (!state.vapidPublicKey) {
      state.vapidPublicKey = await pushService.getPublicConfig();
    }

    return state.vapidPublicKey;
  };

  const handleSubscribe = async () => {
    const publicKey = await ensurePublicKey();
    state.subscription = await pushService.subscribe(state.registration, publicKey);
    await syncSubscription();
    await pushService.showSubscriptionSuccess(state.registration);
    bus.emit('log', 'Inscrição push criada');
    bus.emit('toast', { message: 'Notificações ativas com sucesso.', type: 'success' });
  };

  const handleUnsubscribe = async () => {
    const endpoint = await pushService.unsubscribe(state.registration);
    state.subscription = null;
    ui.syncSubscriptionState(false);

    if (endpoint) {
      bus.emit('log', 'Inscrição removida');
      bus.emit('toast', { message: 'Notificações desabilitadas.', type: 'success' });
    }
  };

  const handleTestSubmit = async event => {
    event.preventDefault();

    if (!state.subscription) {
      bus.emit('log', UI_TEXT.subscriptionRequired);
      bus.emit('toast', { message: UI_TEXT.subscriptionRequired, type: 'error' });
      return;
    }

    const title = dom.titleInput.value.trim();
    const message = dom.messageInput.value.trim();
    await pushService.sendLocalTest(state.registration, title, message);

    bus.emit('log', 'Notificação local enviada');
    bus.emit('toast', { message: 'Teste enviado para este dispositivo.', type: 'success' });
  };

  const bindEvents = () => {
    dom.subscribeBtn.addEventListener('click', () => {
      handleSubscribe().catch(error => {
        bus.emit('error', { message: error.message, statusText: UI_TEXT.subscriptionError });
      });
    });

    dom.unsubscribeBtn.addEventListener('click', () => {
      handleUnsubscribe().catch(error => {
        bus.emit('error', { message: error.message, statusText: UI_TEXT.notSubscribed });
      });
    });

    dom.testForm.addEventListener('submit', event => {
      handleTestSubmit(event).catch(error => {
        bus.emit('error', { message: error.message, statusText: UI_TEXT.notSubscribed });
      });
    });
  };

  const bindBus = () => {
    bus.on('log', message => {
      ui.log(message);
    });

    bus.on('toast', payload => {
      ui.toast(payload.message, payload.type);
    });

    bus.on('error', payload => {
      ui.log(payload.message);
      ui.setStatus({ text: payload.statusText, active: false });
      ui.toast(payload.message, 'error');
    });
  };

  const init = async () => {
    bindBus();
    bindEvents();

    if (!pushService.hasSupport()) {
      ui.setStatus({ text: UI_TEXT.unsupported, active: false });
      ui.log('Service Worker, Notification API ou PushManager indisponíveis');
      return;
    }

    try {
      ui.setStatus({ text: UI_TEXT.init, active: false });
      state.registration = await pushService.registerServiceWorker();
      await syncSubscription();

      if (!state.subscription) {
        ui.setStatus({ text: UI_TEXT.ready, active: false });
      }

      bus.emit('log', 'Aplicação inicializada');
    } catch (error) {
      bus.emit('error', { message: error.message, statusText: UI_TEXT.initError });
    }
  };

  return { init };
};
