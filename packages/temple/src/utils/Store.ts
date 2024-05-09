export default class Store {
  //cache of all stores
  public static stores: Record<string, Store> = {};
  //name of the store
  protected _name: string;
  //file path
  protected _path: string;
  //route path
  protected _route: string;
  //module code
  protected _module: string|null = null;
  //style code
  protected _style: string|null = null;
  //head code
  protected _head: string|null = null;
  //body code
  protected _body: string|null = null;
  //parsed code
  protected _code: string|null = null;

  /**
   * Returns a new store or loads an existing one
   */
  public static load(name: string, path: string, route: string) {
    if (!Store.stores[name]) {
      Store.stores[name] = new Store(name, path, route);
    }
    return Store.stores[name];
  }

  /**
   * Returns a store by name
   */
  public static get(name: string) {
    return Store.stores[name];
  }

  /**
   * Returns a json representation of all stores
   */
  public static get json() {
    return Object.keys(Store.stores).filter(
      name => !Store.stores[name].empty
    ).reduce(
      (json, name) => {
        json[name] = Store.stores[name].json;
        return json;
      }, {} as Record<string, {
        name: string,
        path: string,
        route: string,
        module: string|null,
        style: string|null,
        head: string|null,
        body: string|null,
        code: string|null
      }>
    );
  }

  /**
   * Sets the module code
   */
  public set module(module: string) {
    this._module = module;
  }

  /**
   * Sets the style code
   */
  public set style(style: string) {
    this._style = style;
  }

  /**
   * Sets the head code
   */
  public set head(head: string) {
    this._head = head;
  }

  /**
   * Sets the body code
   */
  public set body(body: string) {
    this._body = body;
  }

  /**
   * Sets the code
   */
  public set code(code: string) {
    this._code = code;
  }

  /**
   * Returns the name of the store
   */
  public get name() {
    return this._name;
  }

  /**
   * Returns the absolute path
   */
  public get path() {
    return `${this._path}/${this._name}`;
  }

  /**
   * Returns the route path
   */
  public get route() {
    return `${this._route}/${this._name}`;
  }

  /**
   * Returns the module code
   */
  public get module(): string|null {
    if (typeof this._module === 'string' 
      && this._module.trim().length > 0
    ) {
      return this._module.trim();
    }
    return null;
  }

  /**
   * Returns the style code
   */
  public get style(): string|null {
    if (typeof this._style === 'string' 
      && this._style.trim().length > 0
    ) {
      return this._style.trim();
    }
    return null;
  }

  /**
   * Returns the head code
   */
  public get head(): string|null {
    if (typeof this._head === 'string' 
      && this._head.trim().length > 0
    ) {
      return this._head.trim();
    }
    return null;
  }

  /**
   * Returns the body code
   */
  public get body(): string|null {
    if (typeof this._body === 'string' 
      && this._body.trim().length > 0
    ) {
      return this._body.trim();
    }
    return null;
  }

  /**
   * Returns the code
   */
  public get code(): string|null {
    if (typeof this._code === 'string' 
      && this._code.trim().length > 0
    ) {
      return this._code.trim();
    }
    return null;
  }

  /**
   * Returns a json representation of the store
   */
  public get json() {
    return {
      name: this.name,
      path: this.path,
      route: this.route,
      module: this.module,
      style: this.style,
      head: this.head,
      body: this.body,
      code: this.code
    };
  }

  /**
   * Returns true if the store is empty
   */
  public get empty() {
    return !this._head && !this._body && !this._module && !this._style;
  }

  /**
   * Set the name of the store
   */
  constructor(name: string, path: string, route: string) {
    this._name = name;
    this._path = path;
    this._route = route;
  }

  /**
   * Appends code to the store
   */
  public append(type: 'head'|'body'|'module'|'style'|'code', code: string) {
    if (type === 'head') {
      if (this._head) {
        this._head += code;
      } else {
        this._head = code;
      }
    } else if (type === 'body') {
      if (this._body) {
        this._body += code;
      } else {
        this._body = code;
      }
    } else if (type === 'module') {
      if (this._module) {
        this._module += code;
      } else {
        this._module = code;
      }
    } else if (type === 'style') {
      if (this._style) {
        this._style += code;
      } else {
        this._style = code;
      }
    } else if (type === 'code') {
      if (this._code) {
        this._code += code;
      } else {
        this._code = code;
      }
    }
    return this;
  }
}