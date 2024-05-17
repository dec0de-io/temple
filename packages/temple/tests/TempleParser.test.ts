import fs from 'fs';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import TempleParser from '../src/parser/TempleParser';

describe('Temple Parser', () => {
  it('Should parse Temple File', () => {
    const actual = TempleParser.parse(
      fs.readFileSync(__dirname + '/fixtures/temple.tml', 'utf8')
    );
    //console.log(JSON.stringify(actual, null, 2));
    expect(actual.components.length).to.equal(1);
    expect(actual.scripts.length).to.equal(1);
    expect(actual.styles.length).to.equal(1);
    expect(actual.markup.length).to.equal(27);
  });

  it('Should parse Temple Page', () => {
    const actual = TempleParser.parse(
      fs.readFileSync(__dirname + '/fixtures/page.tml', 'utf8')
    );
    //console.log(JSON.stringify(actual, null, 2));
    expect(actual.components.length).to.equal(3);
    expect(actual.scripts.length).to.equal(0);
    expect(actual.styles.length).to.equal(1);
    expect(actual.markup.length).to.equal(1);
  });
});