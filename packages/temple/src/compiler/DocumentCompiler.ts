//types
import type {
  ComponentToken,
  StyleToken,
  MarkupToken,
  MarkupChildToken
} from '../parser/types';
import type { 
  CompilerOptions, 
  CompilerResults, 
  ComponentRegistry 
} from './types';
//file loaders
import fs from 'fs';
import path from 'path';
import FileLoader from './FileLoader';
//parsers/compilers
import crypto from 'crypto';
import ts from 'typescript';
import { Project, IndentationText } from 'ts-morph';
import TempleParser from '../parser/TempleParser';
import TempleDocument from '../TempleDocument';
import ComponentCompiler from './ComponentCompiler';
import WebpackCompiler from './WebpackCompiler';
//helpers
import { slugify } from './helpers';
import Exception from '../Exception';

/**
 * Note: Documents cant have custom scripts because 
 * logic should be handled on the server
 */
export default class DocumentCompiler {
  //the page name
  static readonly PAGE_NAME = 'page.js';
  //the bundle name
  static readonly BUNDLE_NAME = 'index.js';

  /**
   * Quick compile pattern
   */
  static compile(options: CompilerOptions) {
    const compiler = new DocumentCompiler(options);
    return async (sourceFile: string) => {
      return await compiler.compile(sourceFile);
    }
  }
  //file system to use
  protected _fs: typeof fs;
  //current working directory
  //we need this to locate and compile imported components
  protected _cwd: string;
  //the build path
  protected _buildPath: string;
  //prefix brand
  protected _brand: string;
  //the component compiler
  protected _componentCompiler: ComponentCompiler;
  //the compiled components cache
  protected _compiledComponents: ComponentRegistry = {};

  /**
   * Returns the output folder
   */
  public get buildPath() {
    return this._buildPath;
  }

  /**
   * Returns the current working directory
   */
  public get cwd() {
    return this._cwd;
  }

  /**
   * Returns the current file system
   */
  public get fs() {
    return this._fs;
  }

  /**
   * Sets the source code to compile
   */
  public constructor(options: CompilerOptions) {
    //set the file system
    this._fs = options.fs || fs;
    //set the current working directory
    this._cwd = options.cwd || process.cwd();
    //set the build path
    this._buildPath = FileLoader.absolute(
      options.buildPath || '.temple', 
      this._cwd
    );
    //set the prefix brand
    this._brand = options.brand || 'temple';
    //create a new component compiler
    this._componentCompiler = new ComponentCompiler({
      fs: this._fs,
      cwd: this._cwd,
      brand: this._brand,
      buildPath: this._buildPath
    }, this._compiledComponents);
  }

  /**
   * Generates code
   */
  public async compile(sourceFile: string) {
    sourceFile = FileLoader.absolute(sourceFile, this._cwd);
    if (!this._fs.existsSync(sourceFile)) {
      throw Exception.for('File not found: %s', sourceFile);
    }

    //load the source code
    const sourceCode = this._fs.readFileSync(sourceFile, 'utf-8');
    //parse the source code
    const ast = TempleParser.parse(sourceCode);

    const document = new TempleDocument();
    document.styles = this.styles(ast.styles).join("\n");
    document.scripts = await this.build(sourceFile, ast.components);
    document.head = this.head(ast.markup);
    document.body = this.body(ast.markup); 

    return (props: Record<string, any>) => {
      //return a string of the compiled markup
      document.props = props;
      return document.render();
    };
  }

  /**
   * Generates the body markup
   */
  protected body(markup: MarkupChildToken[]) {
    if (markup.length === 0
      || markup[0].type !== 'MarkupExpression' 
      || markup[0].name !== 'html'
    ) {
      return ''
    }

    const html = markup[0];
    if (!html.children || html.children.length === 0) {
      return '';
    }

    let body: MarkupToken|null = null;
    html.children.forEach(child => {
      if (child.type === 'MarkupExpression' && child.name === 'body') {
        body = child;
      }
    });

    if (body === null) {
      return '';
    }

    return this.markup((body as MarkupToken).children || []);
  }

  /**
   * Compiles all the components and returns a webpack compiler for 
   * bundling all these into a single file
   */
  protected async build(sourceFile: string, tokens: ComponentToken[]) {
    //compile all components
    tokens.forEach(token => {
      //if you think about it... there can't be any duplicate components
      //because customElements.define() is a global registry
      //customElements.define('foo-bar', 'FoobarComponent');
      //this is why we use this._compiledComponents
      //(also to prevent recompiling the same components over and over again)
      //determine the component name
      //use the file name as the component name
      const extname = path.extname(token.source.value);
      const name = path.basename(token.source.value, extname);
      const slug = slugify(name);
      //find the file path relative to this file
      const inputSourceFile = FileLoader.route(
        sourceFile,
        token.source.value
      );
      //create a component compiler
      this._compiledComponents[slug] = this._componentCompiler.compile(
        inputSourceFile
      );
      return this._compiledComponents[slug];
    });
    //now collect all the components
    const components = Object.values(this._compiledComponents);
    const id = crypto
      .createHash('shake256', { outputLength: 10 })
      .update(sourceFile)
      .digest('hex');
    const buildFolder = path.join(this._buildPath, id);
    //setup the webpack compiler
    const compiler = new WebpackCompiler({
      fileSystem: this._fs,
      buildFolder: buildFolder,
      buildName: DocumentCompiler.BUNDLE_NAME
    });
    //add the entry file
    compiler.entry = {
      path: path.resolve(buildFolder, DocumentCompiler.PAGE_NAME),
      code: this.generate(components)
    };
    //add the component files
    components.forEach(component => {
      compiler.addFile(
        path.resolve(buildFolder, `components/${component.classname}.js`),
        component.code
      );
    });
    //return the webpack compiler
    return await compiler.compile();
  }

  /**
   * Generates entry file code
   */
  protected generate(components: CompilerResults[]) {
    //make a new project
    const project = new Project({
      skipAddingFilesFromTsConfig: true,
      compilerOptions: {
        // Set the target JavaScript version
        target: ts.ScriptTarget.ESNext,  
        // Set the module system
        module: ts.ModuleKind.CommonJS
      },
      manipulationSettings: {
        indentationText: IndentationText.TwoSpaces
      }
    });
    //create a new source file
    const source = project.createSourceFile('page.ts');
    components.forEach(component => {
      //import './components/Counter'
      source.addImportDeclaration({
        moduleSpecifier: `./components/${component.classname}`
      });
    });
    // Compile the TypeScript to JavaScript
    const result = source.getEmitOutput();
    // Concatenate all JavaScript output into a single string
    return result.getOutputFiles()
      .filter(file => file.getFilePath().endsWith('.js'))
      .map(file => file.getText())
      .join('\n'); 
  }

  /**
   * Generates the head markup
   */
  protected head(markup: MarkupChildToken[]) {
    if (markup.length === 0
      || markup[0].type !== 'MarkupExpression' 
      || markup[0].name !== 'html'
    ) {
      return ''
    }

    const html = markup[0];
    if (!html.children || html.children.length === 0) {
      return '';
    }

    let head: MarkupToken|null = null;
    html.children.forEach(child => {
      if (child.type === 'MarkupExpression' && child.name === 'head') {
        head = child;
      }
    });

    if (head === null) {
      return '';
    }

    return this.markup((head as MarkupToken).children || []);
  }

  /**
   * Compiles the markup
   */
  protected markup(children: MarkupChildToken[]) {
    return children.map(child => {
      let expression = '';
      if (child.type === 'MarkupExpression') {
        const tagName = Object
          .values(this._compiledComponents)
          .find(component => component.tagname === child.name)
          ? `${this._brand}-${child.name}`
          : child.name; 
        expression = `<${tagName}`;
        if (child.attributes && child.attributes.properties.length > 0) {
          expression += ' ' + child.attributes.properties.map(property => {
            if (property.value.type === 'Literal') {
              if (typeof property.value.value === 'string') {
                return `${property.key.name}="${property.value.value}"`;
              }
              //null, true, false, number will be passed as a blob url
              return `${property.key.name}="\${${
                property.value.value
              }}"`;
            } else if (property.value.type === 'Identifier') {
              return `${property.key.name}="\${${
                property.value.name
              }}"`;
            } else if (property.value.type === 'ProgramExpression') {
              return `${property.key.name}="\${${
                property.value.source
              }}"`;
            }

            return false;
          }).filter(Boolean).join(' ');
        }
        if (child.kind === 'inline') {
          expression += ' />';
        } else {
          expression += '>';
          if (child.children) {
            expression += this.markup(child.children);
          }
          expression += `</${tagName}>`;
        }
      } else if (child.type === 'Literal') {
        expression += child.value;
      } else if (child.type === 'ProgramExpression') {
        expression += `\${${child.source}}`;
      }
      return expression;
    }).join('');
  }

  /**
   * Compiles the styles
   */
  protected styles(styles: StyleToken[]) {
    return styles.map(style => style.source);
  }
}