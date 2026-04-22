export const createEventBus = () => {
  const listeners = new Map();

  const on = (eventName, listener) => {
    if (!listeners.has(eventName)) {
      listeners.set(eventName, new Set());
    }

    listeners.get(eventName).add(listener);

    return () => {
      listeners.get(eventName)?.delete(listener);
    };
  };

  const emit = (eventName, payload) => {
    const subscribers = listeners.get(eventName);
    if (!subscribers) {
      return;
    }

    subscribers.forEach(listener => {
      try {
        listener(payload);
      } catch (error) {
        console.error('Erro em listener de evento:', error);
      }
    });
  };

  return { on, emit };
};
