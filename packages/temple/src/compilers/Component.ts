//types
import { 
  Node, 
  Attributes, 
  ComponentOptions
} from '../types';
//vendors
import nodePath from 'path';
//locals
import Markup from './Markup';
import Store from '../utils/Store';
import Loader from '../utils/Loader';
import Exception from '../utils/Exception';
import make from '../polyfills/WebComponent';

/**
 * Compiles and renders web components
 */
export default class Component {
  //current working directory
  protected cwd = process.cwd();
  //default prefix
  protected prefix = 'temple';
  //default extension
  protected extension = '.html';
  //default minify
  protected minify = false;

  /**
   * Set the options
   */
	constructor(options: ComponentOptions = {}) {
    if (typeof options.extension === 'string') {
      this.extension = options.extension;
    }
    if (typeof options.cwd === 'string') {
      this.cwd = options.cwd;
    }
    if (typeof options.prefix === 'string') {
      this.prefix = options.prefix;
    }
  }
  
  /**
   * Compiles a document or component
   */
  public compile(route: string, path: string, slots: Attributes = {}) {
    //get absolute path
    const absolute = Loader.absolute(path, this.cwd);
    const relative = Loader.route(path, route);
    //get the basename
    const basename = nodePath.basename(absolute, this.extension);
    //load a new store
    const store = Store.load(
      basename, 
      nodePath.dirname(absolute), 
      nodePath.dirname(relative)
    );
    if (!store.empty) {
      return Store.json;
    }
    
    //get parent tree
    const tree = Markup.load(absolute);
    //check children
    if (!tree.childNodes?.length) {
      throw Exception.for('No children found in `%s`', path);
    }
    //walk the tree
    this.walk(tree, (node, action) => {
      //things we care about
      // - links
      // - scripts
      // - styles
      // - custom tags
      switch (node.nodeName) {
        case 'script':
          //add node to scripts
          this.catScript(node, store);
          //either way, dont add to buffer, but continue walking
          return -1;
        case 'style':
          //add node to styles
          this.catStyle(node, store);
          //either way, dont add to buffer, but continue walking
          return -1;
        case 'link':
          //get attributes
          const attributes = Markup.attributes(node, slots);
          //if it's an import
          if (attributes.rel == 'import' && attributes.href) {
            this.catComponent(node, slots, relative);
            //dont add to buffer, but continue walking
            return -1;
          }
        default:
          this.catMarkup(node, action, store);
          //continue walking
          return 1;
      }
    });
    return Store.json;
  }

  /**
   * Adds script code to the scripts buffer 
   */
  protected catScript(node: Node, store: Store) {
    const script = Markup.toString(node).inner || '';
    //if there is code
    if (script.trim().length) {
      //add to scripts
      store.append('module', script);
    }
  }

  /**
   * Adds style code to the styles buffer 
   */
  protected catStyle(node: Node, store: Store) {
    const style = Markup.toString(node).inner || '';
    //if there is code
    if (style.trim().length) {
      //add to scripts
      store.append('style', style);
    }
  }

  /**
   * Adds component script code to the scripts buffer 
   */
  protected catComponent(node: Node, slots: Attributes, route: string) {
    const parent = node.sourceCodeLocation?.file as string;
    const path = Markup.attributes(node, slots).href as string;
    const relative = nodePath.dirname(
      Loader.route(path, nodePath.dirname(route))
    );
    new Component({ 
      cwd: nodePath.dirname(parent),
      prefix: this.prefix,
      extension: this.extension,
      minify: this.minify
    }).compile(relative, path);

    const basename = nodePath.basename(path, this.extension);
    const store = Store.get(basename);
    store.code = this.make(basename);
  }

  /**
   * Adds markup code to the markup buffer 
   */
  protected catMarkup(
    node: Node, 
    action: string, 
    store: Store, 
    destination: 'head'|'body' = 'body'
  ) {
    //get the codes
    const code = Markup.toString(node);
    //if open action
    const fragment = action === 'open' && code.start 
      ? code.start.trim()
      : action === 'close' && code.end
      ? code.end.trim()
      : action === 'openclose'
      ? (node.value || code.outer || '').trim()
      : '';

    if (fragment.length > 0) {
      //if it's a custom tag
      if (Store.get(node.nodeName)) {
        store.append(destination, fragment
          .replace(`</${node.nodeName}>`, `</${this.prefix}-${node.nodeName}>`)
          .replace(`<${node.nodeName}`, `<${this.prefix}-${node.nodeName}`)
        );
      } else {
        store.append(destination, fragment);
      }
      
    }
  }

  /**
   * Compiles to the final root
   */
  protected compileRoot(slots: Attributes, store: Store) {
    const body = store.body || '';
    const root = Array.from(
      body.matchAll(/\$\{([a-zA-Z0-9_]+)\}/g)
    ).reduce(
      (root, name) => {
        const [ variable, key ] = name;
        if (typeof slots[key] !== 'undefined') {
          return root.replace(variable, slots[key]?.toString() || '')
        }
        return root;
      },
      body
    );

    return root;
  }

  /**
   * Walks the tree generated by parse5
   */
  protected walk(current: Node, tick: (node: Node, action: string) => number) {
    //if there are children
    if (current.childNodes?.length) {
      const status = tick(current, 'open');
      //if status is 1, walk children
      if (status === 1) {
        //loop through children
        for (const child of current.childNodes) {
          //if sub walking returns false, stop walking
          if (this.walk(child, tick) === false) {
            return false;
          }
        }
        //if tick returns false, stop walking
        if (tick(current, 'close') === 0) {
          return false;
        }
      }
      return status !== 0;
    }
    
    return tick(current, 'openclose') !== 0;
  }

  /**
   * Converts a component to web component class code
   */
  protected make(name: string) {
    const store = Store.get(name);
    if (!store || store.empty) {
      throw Exception.for('Component `%s` not found', name);
    }
    const useShadow = !!store.style;
    const body = store.body || '';
    const style = store.style || '';
    const module = store.module || '';
    //get the names from the component, and prep them for the template
    const attributes = Array.from(
      body.matchAll(/\$\{([a-zA-Z0-9_]+)\}/g)
    ).map(name => name[1]);
    const markup = [ body ];
    if (useShadow) {
      markup.unshift(`<style>${style}</style>`);
    }

    return make(
      `${this.prefix}-${name}`, 
      useShadow, 
      attributes, 
      module, 
      markup.join('')
    );
  }
}