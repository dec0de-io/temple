export type RegistryIterator<T = any> = (
  temple: TempleElement,
  element: HTMLElement
) => T;

/**
 * A registry of all TempleElement instances to add better attribute handling
 */
export default class TempleElement {
  //A registry of all TempleElement instances
  protected static registry = new Map<HTMLElement, TempleElement>();

  /**
   * Creates a new TempleElement instance
   */
  public static create(
    name: string, 
    attributes: Record<string, any>, 
    children: HTMLElement[] = []
  ) {
    const element = document.createElement(name);
    for (const [ key, value ] of Object.entries(attributes)) {
      if (typeof value === 'string') {
        element.setAttribute(key, value);
      }
    }
    children.forEach(child => element.appendChild(child));
    return this.register(element, attributes);
  }

  /**
   * Like array filter for registry
   */
  public static filter(callback: RegistryIterator<boolean>) {
    const elements: TempleElement[] = [];
    this.registry.forEach((temple, html) => {
      if (callback(temple, html)) {
        elements.push(temple);
      }
    });
    return elements;
  }

  /**
   * Returns the TempleElement instance for the given element
   */
  public static get(element: HTMLElement) {
    return this.registry.get(element) || null;
  }

  /**
   * Like array map for registry
   */
  public static map<T = any>(callback: RegistryIterator<T>) {
    const elements: T[] = [];
    this.registry.forEach((temple, html) => {
      elements.push(callback(temple, html));
    });
    return elements;
  }

  /**
   * Waits for the DOM to be ready before calling the next function
   */
  public static onReady(next: Function) {
    // see if DOM is already available
    if (document.readyState === 'complete' 
      || document.readyState === 'interactive'
    ) {
      // call on next available tick
      setTimeout(next, 1);
    } else {
      document.addEventListener('DOMContentLoaded', () => next());
    }
  }

  /**
   * Registers a new TempleElement instance
   */
  public static register(element: HTMLElement, attributes?: Record<string, any>) {
    if (this.registry.has(element)) {
      return this.get(element) as TempleElement;
    }
    return new TempleElement(element, attributes || {});
  }

  //the html element
  protected _element: HTMLElement;
  //the html element attributes (with any value)
  protected _attributes: Record<string, any>;

  /**
   * Returns the attributes of the element
   */
  public get attributes() {
    return Object.assign({}, this._attributes);
  }

  /**
   * Returns the element
   */
  public get element() {
    return this._element;
  }

  /**
   * Creates the HTML element and adds it to the registry 
   */
  public constructor(element: HTMLElement, attributes: Record<string, any>) {
    this._element = element;
    this._attributes = attributes;
    for (const [ key, value ] of Object.entries(attributes)) {
      const exists = this._element.getAttribute(key);
      if (exists && typeof value === 'string' && exists !== value) {
        this._element.setAttribute(key, value);
      }
    }
    //add to registry
    TempleElement.registry.set(this._element, this);
  }

  /**
   * Returns true if the attribute exists
   */
  public hasAttribute(key: string) {
    return key in this._attributes;
  }

  /**
   * Returns the attribute value
   */
  public getAttribute<T = any>(key: string) {
    return this._attributes[key] as T;
  }

  /**
   * Removes the attribute
   */
  public removeAttribute(key: string) {
    delete this._attributes[key];
    this._element.removeAttribute(key);
  }

  /**
   * Returns a serialized version of the attributes
   */
  public serialize(attributes?: Record<string, any>) {
    if (!attributes) {
      attributes = this._attributes;
    }
    return JSON.stringify(attributes, (name, value) => {
      if (typeof value === 'function') {
        return value.toString();
      }
      return value;
    });
  }

  /**
   * Sets the attribute value
   */
  public setAttribute(key: string, value: any) {
    this._attributes[key] = value;
    if (typeof value === 'string') {
      this._element.setAttribute(key, value);
    }
  }

  /**
   * Sets the attributes
   */
  public setAttributes(attributes: Record<string, any>) {
    //loop through all the attributes
    for (const [ key, value ] of Object.entries(attributes)) {
      //get the current attribute value
      const current = this.getAttribute(key);
      //if the value is different, set it
      if (current !== value) {
        this.setAttribute(key, value);
      }
    }
    //get all the names so we know which ones to remove
    const names = Object.keys(attributes);
    //loop through all the element attributes
    for (const key of Object.keys(this._attributes)) {
      //if the key is not in the names, remove it
      if (!names.includes(key)) {
        this.removeAttribute(key);
      }
    }
  }
}