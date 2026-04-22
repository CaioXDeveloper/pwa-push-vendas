import { SELECTORS } from './constants.js';

export const getDomRefs = root => {
  const dom = {
    statusDot: root.querySelector(SELECTORS.statusDot),
    statusText: root.querySelector(SELECTORS.statusText),
    subscribeBtn: root.querySelector(SELECTORS.subscribeBtn),
    unsubscribeBtn: root.querySelector(SELECTORS.unsubscribeBtn),
    testForm: root.querySelector(SELECTORS.testForm),
    titleInput: root.querySelector(SELECTORS.titleInput),
    messageInput: root.querySelector(SELECTORS.messageInput),
    logFeed: root.querySelector(SELECTORS.logFeed),
    toastRegion: root.querySelector(SELECTORS.toastRegion)
  };

  Object.entries(dom).forEach(([name, element]) => {
    if (!element) {
      throw new Error(`Elemento obrigatório não encontrado: ${name}`);
    }
  });

  return dom;
};
