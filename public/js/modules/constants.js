export const SELECTORS = {
  statusDot: '#statusDot',
  statusText: '#statusText',
  subscribeBtn: '#subscribeBtn',
  unsubscribeBtn: '#unsubscribeBtn',
  testForm: '#testForm',
  titleInput: '#titleInput',
  messageInput: '#messageInput',
  logFeed: '#logBox',
  toastRegion: '#toastRegion'
};

export const API_ROUTES = {
  publicConfig: '/api/public-config',
  subscribe: '/api/subscribe',
  unsubscribe: '/api/unsubscribe'
};

export const UI_TEXT = {
  init: 'Carregando...',
  ready: 'Pronto para inscrição',
  subscribed: 'Notificações ativadas neste navegador',
  notSubscribed: 'Notificações desativadas',
  unsupported: 'Este navegador não suporta Push API',
  initError: 'Erro ao inicializar',
  subscriptionError: 'Não foi possível ativar as notificações',
  subscriptionRequired: 'Ative as notificações antes de enviar o teste'
};

export const DEFAULT_NOTIFICATION = {
  title: 'Nova notificação',
  message: 'Você recebeu uma atualização',
  successTitle: 'Notificações ativadas',
  successMessage: 'Tudo certo, seu navegador já pode receber avisos',
  icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%230b1220' width='192' height='192'/><rect fill='%234f9dff' x='20' y='20' width='152' height='152' rx='28'/><text x='96' y='106' font-size='76' fill='white' text-anchor='middle' dominant-baseline='middle' font-family='Arial'>🔔</text></svg>"
};
