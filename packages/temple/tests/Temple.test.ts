import { describe, it } from 'mocha';
//import { expect, use } from 'chai';

import { TempleDocument } from '../src';

describe('Temple Tests', () => {
  it('Should parse AST', async () => {
    const temple = new TempleDocument({
      cwd: __dirname
    });
    const results = temple.compile('/foo/bar/zoo', './fixtures/page.html', {
      header: 'This is Header 1',
      paragraph: 'This is Paragraph'
    });
    console.log(results);
  });
});
