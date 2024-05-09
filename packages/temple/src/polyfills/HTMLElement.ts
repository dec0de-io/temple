//polyfill to extend from
export default class HTMLElement {
  public innerHTML = '';
  attachShadow(config: { mode: 'open' | 'closed' }) {
    return {
      innerHTML: ''
    };
  }
};