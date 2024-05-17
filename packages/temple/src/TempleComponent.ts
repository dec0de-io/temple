export default abstract class TempleComponent extends HTMLElement {
  //current component
  protected static _current: TempleComponent|null = null;

  /**
   * Returns the current component
   */
  public static get current() {
    return TempleComponent._current;
  }

  //component props
  protected _properties: Record<string, any> = {};
  protected _serialized: string = '';
  //whether shadow mode is on
  protected _shadowRoot: ShadowRoot|null = null;
  //whether the component has initiated
  protected _initiated: boolean = false;

  /**
   * Returns the component styles
   */
  public abstract styles(): string;

  /**
   * Returns the component template
   */
  public abstract template(): string;

  /**
   * Returns the component properties
   */
  public get props() {
    return this._properties;
  }

  /**
   * Returns whether the component has initiated
   */
  public get initiated() {
    return this._initiated;
  }

  /**
   * Sets the component properties
   */
  public set props(props: Record<string, any>) {
    const serialized = JSON.stringify(props);
    if (serialized !== this._serialized) {
      (async () => {
        this._properties = {};
        for (const [ name, value ] of Object.entries(props)) {
          if (value.startsWith('blob:')) {
            let decoded = await this.decode(value);
            if (value === 'true') {
              decoded = true;
            } else if (value === 'false') {
              decoded = false;
            } else if (value === 'null') {
              decoded = null;
            }
            this._properties[name] = decoded;
          } else {
            this._properties[name] = value;
          } 
        }
        this._serialized = serialized;
        this.render();
      })()
    }
  }

  /**
   * Called when component moved to a new document
   */
  public adoptedCallback() {
    this.render();
  }

  /**
   * Called when an attribute is added, removed, updated, or replaced
   * but you need to set observedAttributes first.
   * ie. static observedAttributes = ["color", "size"]; 
   */
  public attributeChangedCallback(
    name: string, 
    previous: string, 
    value: string
  ) {
    this.props = { ...this._properties, [name]: value };
  }

  /**
   * Called when the element is inserted into a document,
   */
  public connectedCallback() {
    //attributes are ready here
    this.wait();
  }

  /**
   * Called when the element is removed from a document
   */
  public disconnectedCallback() {
    //remove listeners here
  }

  /**
   * Renders the component
   */
  public render() {
    //set the current component
    TempleComponent._current = this;
    //get the styles
    const styles = this.styles();
    //get the template
    const template = this.template();
    //if no styles, just set the innerHTML
    if (styles.length === 0) {
      this.innerHTML = template;
    //there are styles, use shadow dom
    } else {
      //if shadow root is not set, create it
      if (!this._shadowRoot) {
        this._shadowRoot = this.attachShadow({ mode: 'open' });
      }
      //empty the current innerHTML
      //the old data is captured in props
      this.innerHTML = '';
      //set the shadow root
      this._shadowRoot.innerHTML = `<style>${styles}</style>${template}`;
    }
    //reset the current component
    TempleComponent._current = null;
    this._initiated = true;
  }

  /**
   * Helper to decode a value from a URI blob memory
   */
  protected async decode(bloburl: string) {
    return fetch(bloburl)
      .then(resp => resp.blob())
      .then(blob => blob.text())
      .then(JSON.parse);
  }
  
  /**
   * Helper to encode a value to URI blob memory
   */
  protected encode(value: any) {
    if (typeof value === 'string') {
      return value;
    }
    const json = JSON.stringify(value);
    const blob = new Blob(
      [ json ], 
      { type: 'application/json' }
    );
    return URL.createObjectURL(blob);
  }

  /**
   * Returns true when the document is ready
   */
  protected ready() {
    // check if the parser has already passed the end tag of the component
    // in which case this element, or one of its parents, should have a nextSibling
    // if not (no whitespace at all between tags and no nextElementSiblings either)
    // resort to DOMContentLoaded or load having triggered
    const parents: ParentNode[] = [];
    // collect the parentNodes
    let el: ParentNode = this;
    while (el.parentNode) {
      el = el.parentNode;
      parents.push(el);
    }

    return [ this, ...parents ].some(element => element.nextSibling) 
      || document.readyState !== 'loading';
  }

  /**
   * Handles spreads
   */
  protected spread(props: Record<string, any>) {
    const spread = [];
    for (const [ key, value ] of Object.entries(props)) {
      spread.push(`${key}="${this.encode(value)}"`);
    }
    return spread.join(' ');
  }

  /**
   * Sets the initial properties and children
   */
  protected update(children: string) { 
    const entries = Object.fromEntries(
      Array.from(this.attributes).map(
        attribute => [ attribute.nodeName, attribute.nodeValue ]
      )
    );

    if (entries.class) {
      entries.className = entries.class;
      delete entries.class;
    }

    if (entries.classname) {
      entries.className = entries.classname;
      delete entries.classname;
    }

    this.props = { ...this._properties, ...entries, children };
  }

  /**
   * Waits for the document to be first ready
   */
  protected wait() {
    if (this.ready()) {
      this.update(this.innerHTML);
    } else {
      const mutationObserver = new MutationObserver(() => {
        if (this.ready()) {
          this.update(this.innerHTML);
          mutationObserver.disconnect();
        }
      });
      mutationObserver.observe(this, { childList: true });
    }
  }
}