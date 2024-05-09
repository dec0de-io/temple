//types
import { Attributes } from '../types';
//vendors
import nodePath from 'path';
import ugly from 'uglify-js';
//locals
import Markup from './Markup';
import Component from './Component';
import Store from '../utils/Store';
import Loader from '../utils/Loader';
import Exception from '../utils/Exception';

/**
 * Compiles and renders HTML documents
 */
export default class TempleDocument extends Component {
  /**
   * Renders the document
   */
  public render(route: string, path: string, slots: Attributes = {}) {
    const absolute = Loader.absolute(path, this.cwd);
    const basename = nodePath.basename(absolute, this.extension);
    return this.compile(route, path, slots)[basename].code;
  }

  /**
   * Compiles a document or component
   */
  public compile(route: string, path: string, slots: Attributes = {}) {
    let markup = 'page';
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
    console.log(tree.childNodes?.[0].childNodes?.[2].childNodes)
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
      }
      //toggle between page, head and body
      if (node.nodeName === 'head' && action === 'open') {
        markup = 'head';
        //skip head, but continue walking
        return 1;
      } else if (node.nodeName === 'head' && action === 'close') {
        markup = 'page';
      } else if (node.nodeName === 'body' && action === 'open') {
        markup = 'body';
        //skip body, but continue walking
        return 1;
      } else if (node.nodeName === 'body' && action === 'close') {
        markup = 'page';
      }
      //if we are in the head
      if (markup === 'head') {
        //add to head
        this.catMarkup(node, action, store, 'head');
      //if we are in the body
      } else if (markup === 'body') {
        //add to body
        this.catMarkup(node, action, store, 'body');
      }
      //skip page, but continue walking
      return 1;
    });
    store.code = this.compileDocument(slots, store);
    return Store.json;
  }

  /**
   * Compiles to the final root
   */
  protected compileDocument(slots: Attributes, store: Store) {
    const head = store.head || '';
    const body = store.body || '';
    const scripts = Object
      .values(Store.json)
      .map(store => store.code)
      .filter(Boolean);
    
    const inject = {
      head: Array.from(
        head.matchAll(/\$\{([a-zA-Z0-9_]+)\}/g)
      ).reduce(
        (document, name) => {
          const [ variable, key ] = name;
          const value = slots[key]?.toString() || '';
          return document.replace(variable, value)
        },
        head
      ),
      body: Array.from(
        body.matchAll(/\$\{([a-zA-Z0-9_]+)\}/g)
      ).reduce(
        (document, name) => {
          const [ variable, key ] = name;
          const value = slots[key]?.toString() || '';
          return document.replace(variable, value)
        },
        body
      ),
      scripts: scripts.length ? `<script type="module">${
        this.minify 
          ? ugly.minify(scripts.join('\n')).code 
          : scripts.join('\n')
      }</script>` : '',
      styles: store.style ? `<style>${store.style}</style>` : ''
    };

    return `<!DOCTYPE html><html><head>${
      inject.head
    }${
      inject.styles
    }${
      inject.scripts
    }</head><body>${
      inject.body
    }</body></html>`;
  }
};