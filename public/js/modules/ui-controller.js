import { getTimeStamp } from './utils.js';
import { UI_TEXT } from './constants.js';

export const createUiController = dom => {
  const setStatus = ({ text, active }) => {
    dom.statusText.textContent = text;
    dom.statusDot.classList.toggle('is-active', active);
    dom.statusDot.classList.toggle('is-inactive', !active);
  };

  const toggleSubscriptionButtons = subscribed => {
    dom.subscribeBtn.classList.toggle('is-hidden', subscribed);
    dom.unsubscribeBtn.classList.toggle('is-hidden', !subscribed);
  };

  const syncSubscriptionState = subscribed => {
    toggleSubscriptionButtons(subscribed);
    setStatus({
      text: subscribed ? UI_TEXT.subscribed : UI_TEXT.notSubscribed,
      active: subscribed
    });
  };

  const log = message => {
    const entry = document.createElement('p');
    entry.className = 'log-entry';
    entry.textContent = `[${getTimeStamp()}] ${message}`;
    dom.logFeed.prepend(entry);

    if (dom.logFeed.childElementCount > 30) {
      dom.logFeed.lastElementChild?.remove();
    }
  };

  const toast = (message, type = 'success') => {
    const toastElement = document.createElement('div');
    toastElement.className = `toast toast--${type}`;
    toastElement.textContent = message;
    dom.toastRegion.append(toastElement);

    window.setTimeout(() => {
      toastElement.remove();
    }, 3200);
  };

  return {
    setStatus,
    syncSubscriptionState,
    log,
    toast
  };
};
