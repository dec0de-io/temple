import type fs from 'fs';
import type { 
  ImportToken,
  ComponentToken,
  ScriptToken,
  StyleToken,
  MarkupToken
} from '../parser/types';

export type CompilerOptions = { 
  fs?: typeof fs,
  cwd?: string,
  brand?: string,
  buildPath?: string
};

export type ImportChunk = {
  typeOnly: boolean;
  names: any[] | undefined;
  default: any;
  source: any;
};

export type TemplateChunks = {
  tagname: string,
  classname: string,
  imports: ImportChunk[],
  scripts: string[],
  styles: string[],
  markup: string
};

export type CompilerResults = {
  ast: AST,
  basename: string,
  tagname: string,
  classname: string,
  components: ComponentRegistry,
  imports: ImportChunk[],
  scripts: string[],
  styles: string[],
  markup: string,
  code: string
};

export type ComponentRegistry = Record<string, CompilerResults>;

export type AST = {
  imports: ImportToken[];
  components: ComponentToken[];
  scripts: ScriptToken[];
  styles: StyleToken[];
  markup: MarkupToken[];
}