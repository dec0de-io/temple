export default abstract class TempleComponent extends HTMLElement {
  protected properties: Record<string, any> = {};
  constructor() {
    // Always call super first in constructor
    super();
  }

  get props() {
    return this.properties;
  }

  set props(value: Record<string, any>) {
    this.properties = value;
    this.render();
  }

  connectedCallback() {
    //attributes are ready here
    const entries = Array.from(this.attributes).map(
      attr => [ attr.nodeName, attr.nodeValue ]
    );
    this.props = {
      ...this.properties,
      ...Object.fromEntries(entries)
    };
  }

  disconnectedCallback() {
    //remove listeners here
  }

  adoptedCallback() {
    this.render();
  }

  attributeChangedCallback(
    name: string, 
    previous: string, 
    value: string
  ) {
    this.props = { ...this.properties, [name]: value };
  }

  abstract render(): void;
}