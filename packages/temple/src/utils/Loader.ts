import fs from 'fs';
import path from 'path';

/**
 * Loader
 */
export default class Loader {
  /**
   * Returns the absolute path to the file
   */
  static absolute(pathname: string, cwd?: string) {
    cwd = cwd || this.cwd();
    if (/^\.{1,2}\//.test(pathname)) {
      pathname = path.resolve(cwd, pathname);
    }
    //if the pathname does not start with /, 
    //the path should start with modules
    if (!pathname.startsWith('/')) {
      pathname = path.resolve(this.modules(cwd), pathname);
    }
    return pathname;
  }

  static route(pathname: string, route: string) {
    if (/^\.{1,2}\//.test(pathname)) {
      pathname = path.resolve(route, pathname);
    }
    //if the pathname does not start with /, 
    //the path should start the parent directory of route
    if (!pathname.startsWith('/')) {
      if (route === '/') {
        pathname = path.resolve('/', pathname);
      } else {
        pathname = path.resolve(path.dirname(route), pathname);
      }
    }
    return pathname;
  }

  /**
   * Returns the current working directory
   */
  static cwd() {
    return process.cwd();
  }

  /**
   * Should locate the node_modules directory 
   * where temple is actually installed
   */
  static modules(cwd?: string): string {
    cwd = cwd || this.cwd();
    if (cwd === '/') {
      throw new Error('Could not find node_modules');
    }
    if (fs.existsSync(path.resolve(cwd, 'node_modules/@dec0de/temple'))) {
      return path.resolve(cwd, 'node_modules');
    }
    return this.modules(path.dirname(cwd));
  }
}