import fs from 'fs';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import TempleCompiler from '../src/TempleCompiler';

describe('Temple Parser', () => {

  it('Should parse Temple File', () => {
    const actual = TempleCompiler.compile(
      fs.readFileSync(__dirname + '/fixtures/temple.tml', 'utf8')
    );
    //console.log(JSON.stringify(actual, null, 2));
    //expect(actual.imports.length).to.equal(1);
    //expect(actual.scripts.length).to.equal(1);
    //expect(actual.styles.length).to.equal(1);
    //expect(actual.markup.length).to.equal(29);
  });
});