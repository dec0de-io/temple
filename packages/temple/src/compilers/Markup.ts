//types
import { Node, Attributes } from '../types';
//vendors
import fs from 'fs';
import { parse } from 'parse5';
//locals
import Exception from '../utils/Exception';

/**
 * Parses and upgrades the parse5 tree
 */
export default class Markup {
  /**
   * Converts a node's attribute array to an object
   */
	static attributes(node: Node, globals: Attributes = {}): Attributes {
		const attributes = node.attrs || []
		return attributes.reduce((previous, current) => {
			previous[current.name] = current.value;
			return previous;
		}, Object.assign({}, globals));
	}

  /**
   * Parses a string into a tree
   */
	static compile(contents: string) {
		return parse(contents, {
			scriptingEnabled: true,
			sourceCodeLocationInfo: true,
		}) as Node;
	}

  /**
   * Loads a file, parses it and upgrades the tree
   */
	static load(path: string) {
		//get content
		const content = fs.readFileSync(path, 'utf8');
		//check parent content
		if(!content.trim()) {
			throw Exception.for('No content in `%s`', path);
		}
		//parse content, then add file to the 
		//sourceCodeLocation everywhere, then cache it
		return this.upgrade(
			this.compile(content), 
			path
		);
	}

  /**
   * Returns the string representations of a node
   */
	static toString(node: Node) {
		//check to see if there is a file location
		if (!node.sourceCodeLocation?.file) {
			return { outer: null, inner: null, start: null, end: null };
		}
		//get the content
		const content = fs.readFileSync(node.sourceCodeLocation.file, 'utf8');
		const outer = content.substring(
			node.sourceCodeLocation.startOffset, 
			node.sourceCodeLocation.endOffset
		);
		if ('startTag' in node.sourceCodeLocation 
			&& 'endTag' in node.sourceCodeLocation
		) {
			const start = content.substring(
				node.sourceCodeLocation.startTag?.startOffset as number, 
				node.sourceCodeLocation.startTag?.endOffset as number
			);
			const end = content.substring(
				node.sourceCodeLocation.endTag?.startOffset as number, 
				node.sourceCodeLocation.endTag?.endOffset as number
			);
			const inner = content.substring(
				node.sourceCodeLocation.startTag?.endOffset as number, 
				node.sourceCodeLocation.endTag?.startOffset as number
			);
			return { outer, inner, start, end};
		}
		return { outer, inner: null, start: null, end: null };
	}

  /**
   * Upgrades a node's sourceCodeLocation to include the file path
   */
	static upgrade(node: Node, path: string) {
		if (node.sourceCodeLocation) {
			node.sourceCodeLocation.file = path;
		}
		if (node.childNodes) {
			node.childNodes.forEach(child => {
				this.upgrade(child, path);
			});
		}
		return node;
	}
};