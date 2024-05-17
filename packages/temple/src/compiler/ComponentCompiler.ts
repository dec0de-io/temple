//types
import type { 
  ComponentToken,
  ImportToken, 
  MarkupChildToken, 
  ScriptToken,
  StyleToken,
} from '../parser/types';
import type { 
  CompilerOptions, 
  TemplateChunks, 
  ComponentRegistry
} from './types';
//file systems
import fs from 'fs';
import path from 'path';
import FileLoader from './FileLoader';
//parsers/compilers
import ts from 'typescript';
import { Project, IndentationText } from 'ts-morph';
import DataParser from '../parser/DataParser';
import TempleParser from '../parser/TempleParser';
//helpers
import { camelize, slugify } from './helpers';
import Exception from '../Exception';

export default class ComponentCompiler {
  //file system to use
  protected _fs: typeof fs;
  //current working directory
  //we need this to locate and compile imported components
  protected _cwd: string;
  //prefix brand
  protected _brand: string;
  //the compiled components cache
  protected _compiledComponents: ComponentRegistry;

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
  public constructor(options: CompilerOptions, cache: ComponentRegistry) {
    //set the file system
    this._fs = options.fs || fs;
    //set the current working directory
    this._cwd = options.cwd || process.cwd();
    //set the prefix brand
    this._brand = options.brand || 'temple';
    //set the compiled components cache
    this._compiledComponents = cache;
  }

  /**
   * Generates code
   */
  public compile(sourceFile: string) {
    sourceFile = FileLoader.absolute(sourceFile, this._cwd);
    if (!this._fs.existsSync(sourceFile)) {
      throw Exception.for('File not found: %s', sourceFile);
    }
    //determine class name
    const basename = path.basename(sourceFile, path.extname(sourceFile));
    //determine slug
    const tagname = slugify(basename);
    //determine camel (capitalized)
    const classname = camelize(basename);
    
    //load the source code
    const sourceCode = this._fs.readFileSync(sourceFile, 'utf-8');
    //parse the source code
    const ast = TempleParser.parse(sourceCode);
    const components = this.components(sourceFile, ast.components);
    const imports = this.imports(ast.imports);
    const scripts = this.scripts(ast.scripts);
    const styles = this.styles(ast.styles);
    const markup = this.markup(ast.markup);
    //generate the code
    const code = this.generate({
      tagname,
      classname,
      imports,
      scripts,
      styles,
      markup
    });

    return {
      ast,
      basename,
      tagname,
      classname,
      components,
      imports,
      scripts,
      styles,
      markup,
      code
    };
  }

  /**
   * Returns the compiled components
   */
  protected components(sourceFile: string, components: ComponentToken[]) {
    return Object.fromEntries(
      components.map(token => {
        //if you think about it... there can't be any duplicate components
        //because customElements.define() is a global registry
        //customElements.define('foo-bar', 'FoobarComponent');
        //this is why we use this._compiledComponents
        //(also to prevent recompiling the same components over and over again)
        //determine absolute path
        const inputSourceFile = FileLoader.route(
          sourceFile,
          token.source.value
        );
        //determine the component name
        //use the file name as the component name
        const extname = path.extname(inputSourceFile);
        const basename = path.basename(inputSourceFile, extname);
        const tagName = slugify(basename);
        //if the component is already compiled
        if (this._compiledComponents[tagName]) {
          //dont do it again
          return [ tagName, this._compiledComponents[tagName] ];
        }

        //create a child compiler
        this._compiledComponents[tagName] = this.compile(inputSourceFile);
        return [ tagName, this._compiledComponents[tagName] ];
      })
    );
  }

  /**
   * Generates code
   */
  protected generate(chunks: TemplateChunks) {
    const { 
      tagname, 
      classname, 
      imports, 
      scripts, 
      styles, 
      markup 
    } = chunks;
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
    const source = project.createSourceFile(`${classname}.ts`);
    //import TempleComponent from '@dec0de-io/temple/dist/TempleComponent'
    source.addImportDeclaration({
      moduleSpecifier: '@dec0de-io/temple/dist/TempleComponent',
      defaultImport: 'TempleComponent'
    });
    //import others from <script>
    imports.forEach(imported => {
      if (imported.default && imported.names) {
        source.addImportDeclaration({
          isTypeOnly: imported.typeOnly,
          moduleSpecifier: imported.source,
          defaultImport: imported.default,
          namedImports: imported.names
        });
      } else if (imported.default) {
        source.addImportDeclaration({
          isTypeOnly: imported.typeOnly,
          moduleSpecifier: imported.source,
          defaultImport: imported.default
        });
      } else if (imported.names) {
        source.addImportDeclaration({
          isTypeOnly: imported.typeOnly,
          moduleSpecifier: imported.source,
          namedImports: imported.names
        });
      }
    });
    //import other components
    //export default class FoobarComponent extends TempleComponent
    const component = source.addClass({
      name: classname,
      extends: 'TempleComponent',
      isDefaultExport: true,
    });
    //public style()
    component.addMethod({
      name: 'styles',
      returnType: 'string',
      statements: `return \`${styles.join('\n').trim()}\`;`
    });
    //public template()
    component.addMethod({
      name: 'template',
      returnType: 'string',
      statements: `${scripts.join('\n')}\nreturn \`${markup.trim()}\`;`
    });

    //customElements.define('foo-bar', 'FoobarComponent');
    source.addStatements(
      `customElements.define('${this._brand}-${tagname}', ${classname});`
    );

    // Compile the TypeScript to JavaScript
    const result = source.getEmitOutput();
    // Concatenate all JavaScript output into a single string
    return result.getOutputFiles()
      .filter(file => file.getFilePath().endsWith('.js'))
      .map(file => file.getText())
      .join('\n'); 
  }

  /**
   * Returns the compiled imports
   */
  protected imports(imports: ImportToken[]) {
    return imports.map(token => ({
      typeOnly: token.typeOnly,
      names: token.names?.map(name => name.value),
      default: token.default?.value,
      source: token.source.value
    }));
  }

  /**
   * Compiles the markup
   */
  protected markup(markup: MarkupChildToken[]) {
    return markup.map(child => {
      let expression = '';
      if (child.type === 'MarkupExpression') {
        const tagName = Object
          .keys(this._compiledComponents)
          .find(tagName => tagName === child.name)
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
              return `${property.key.name}="\${this.encode(${
                property.value.value
              })}"`;
            } else if (property.value.type === 'ObjectExpression') {
              return `${property.key.name}="\${this.encode(${
                JSON.stringify(DataParser.object(property.value))
                  .replace(/"([a-zA-Z0-9_]+)":/g, "$1:")
                  .replace(/"\${([a-zA-Z0-9_]+)}"/g, "\${$1}")
              })}"`;
            } else if (property.value.type === 'ArrayExpression') {
              return `${property.key.name}="\${this.encode(${
                JSON.stringify(DataParser.array(property.value))
                  .replace(/"([a-zA-Z0-9_]+)":/g, "$1:")
                  .replace(/"\${([a-zA-Z0-9_]+)}"/g, "\${$1}")
              })}"`;
            } else if (property.value.type === 'Identifier') {
              return `${property.key.name}="\${this.encode(${
                property.value.name
              })}"`;
            } else if (property.value.type === 'ProgramExpression') {
              return `${property.key.name}="\${this.encode(${
                property.value.source
              })}"`;
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
   * Returns the compiled scripts
   */
  protected scripts(scripts: ScriptToken[]) {
    return scripts.map(script => script.source);
  }

  /**
   * Returns the compiled styles
   */
  protected styles(styles: StyleToken[]) {
    return styles.map(style => style.source);
  }
}