
import type { CompilerOptions } from './compiler/types';

import DataParser from './parser/DataParser';
import GenericLexer from './parser/GenericLexer';
import SymbolParser from './parser/SymbolParser';
import TempleParser from './parser/TempleParser';

import ComponentCompiler from './compiler/ComponentCompiler';
import TempleCompiler from './compiler/DocumentCompiler';
import FileLoader from './compiler/FileLoader';

import definitions, { 
  scalar, 
  data, 
  scan, 
  identifier 
} from './parser/definitions';

function temple(options?: CompilerOptions) {
  return TempleCompiler.compile(options || {});
}

export type * from './parser/types';
export type * from './compiler/types';

export {
  DataParser,
  GenericLexer,
  SymbolParser,
  TempleParser,
  FileLoader,
  ComponentCompiler,
  TempleCompiler,
  definitions,
  scalar,
  data,
  scan,
  identifier,
  temple
};