import type { NS, DOCUMENT_MODE } from './enums';

export type Location = {
  file: string;
  /** One-based line index of the first character. */
  startLine: number;
  /** One-based column index of the first character. */
  startCol: number;
  /** Zero-based first character index. */
  startOffset: number;
  /** One-based line index of the last character. */
  endLine: number;
  /** One-based column index of the last character. Points directly *after* the last character. */
  endCol: number;
  /** Zero-based last character index. Points directly *after* the last character. */
  endOffset: number;
}
export type LocationWithAttributes = Location & {
  /** Start tag attributes' location info. */
  attrs?: Record<string, Location>;
}
export type ElementLocation = LocationWithAttributes & {
  /** Element's start tag location info. */
  startTag?: Location;
  /**
   * Element's end tag location info.
   * This property is undefined, if the element has no closing tag.
   */
  endTag?: Location;
}
export type Attribute = {
  /** The name of the attribute. */
  name: string;
  /** The namespace of the attribute. */
  namespace?: string;
  /** The namespace-related prefix of the attribute. */
  prefix?: string;
  /** The value of the attribute. */
  value: string;
}
export type Document = {
  /** The name of the node. */
  nodeName: '#document';
  /**
   * Document mode.
   *
   * @see {@link DOCUMENT_MODE} */
  mode: DOCUMENT_MODE;
  /** The node's children. */
  childNodes: ChildNode[];
  /** Comment source code location info. Available if location info is enabled. */
  sourceCodeLocation?: Location | null;
}
export type DocumentFragment = {
  /** The name of the node. */
  nodeName: '#document-fragment';
  /** The node's children. */
  childNodes: ChildNode[];
  /** Comment source code location info. Available if location info is enabled. */
  sourceCodeLocation?: Location | null;
}
export type Element = {
  /** Element tag name. Same as {@link tagName}. */
  nodeName: string;
  /** Element tag name. Same as {@link nodeName}. */
  tagName: string;
  /** List of element attributes. */
  attrs: Attribute[];
  /** Element namespace. */
  namespaceURI: NS;
  /** Element source code location info, with attributes. Available if location info is enabled. */
  sourceCodeLocation?: ElementLocation | null;
  /** Parent node. */
  parentNode: ParentNode | null;
  /** The node's children. */
  childNodes: ChildNode[];
}
export type CommentNode = {
  /** The name of the node. */
  nodeName: '#comment';
  /** Parent node. */
  parentNode: ParentNode | null;
  /** Comment text. */
  data: string;
  /** Comment source code location info. Available if location info is enabled. */
  sourceCodeLocation?: Location | null;
}
export type TextNode = {
  nodeName: '#text';
  /** Parent node. */
  parentNode: ParentNode | null;
  /** Text content. */
  value: string;
  /** Comment source code location info. Available if location info is enabled. */
  sourceCodeLocation?: Location | null;
}
export type Template = Element & {
  nodeName: 'template';
  tagName: 'template';
  /** The content of a `template` tag. */
  content: DocumentFragment;
}
export type DocumentType = {
  /** The name of the node. */
  nodeName: '#documentType';
  /** Parent node. */
  parentNode: ParentNode | null;
  /** Document type name. */
  name: string;
  /** Document type public identifier. */
  publicId: string;
  /** Document type system identifier. */
  systemId: string;
  /** Comment source code location info. Available if location info is enabled. */
  sourceCodeLocation?: Location | null;
}
export type ParentNode = Document | DocumentFragment | Element | Template;
export type ChildNode = Element | Template | CommentNode | TextNode | DocumentType;
export type Node = {
  /**
   * Document mode.
   *
   * @see {@link DOCUMENT_MODE} */
  mode?: DOCUMENT_MODE;
  /** Element tag name. Same as {@link tagName}. */
  nodeName: string;
  /** Element tag name. Same as {@link nodeName}. */
  tagName?: string;
  /** List of element attributes. */
  attrs?: Attribute[];
  /** Comment text. */
  data?: string;
  /** Text content. */
  value?: string;
  /** Element namespace. */
  namespaceURI?: NS;
  /** Element source code location info, with attributes. Available if location info is enabled. */
  sourceCodeLocation?: ElementLocation | null;
  /** Parent node. */
  parentNode?: Node | null;
  /** The node's children. */
  childNodes?: Node[];
  /** The content of a `template` tag. */
  content?: DocumentFragment;
  /** Document type public identifier. */
  publicId?: string;
  /** Document type system identifier. */
  systemId?: string;
};
export type Scalar = string | number | boolean;
export type ScalarOmit = string | number | boolean | null | undefined;

export type ComponentOptions = {
  extension?: string,
  prefix?: string,
  cwd?: string,
  minify?: boolean
};

export type Attributes = Record<string, ScalarOmit>;