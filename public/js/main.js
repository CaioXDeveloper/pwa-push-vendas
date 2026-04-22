import { createAppController } from './modules/app-controller.js';
import { getDomRefs } from './modules/dom.js';

const bootstrap = () => {
  const dom = getDomRefs(document);
  const app = createAppController(dom);
  app.init();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
