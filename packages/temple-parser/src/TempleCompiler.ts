import escodegen from 'escodegen';
import TempleParser from './TempleParser';

export default class TempleCompiler {
  static compile(code: string) {
    const compiler = new TempleCompiler(code);
    return compiler.compile();
  }

  protected parser: TempleParser;

  constructor(code: string) {
    this.parser = new TempleParser(code);
  }

  compile() {
    const tree = this.parser.parse();
    const scripts = tree.scripts.map(
      script => escodegen.generate(script.source)
    );
    console.log(scripts);
    //need to reformat the parser to support this
  }
}