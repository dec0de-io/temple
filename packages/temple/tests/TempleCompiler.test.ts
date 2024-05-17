import fs from 'fs';
import path from 'path';
import { describe, it } from 'mocha';
import { expect } from 'chai';
import DocumentCompiler from '../src/compiler/DocumentCompiler';

describe('Temple Compiler', () => {

  it('Should compile Temple Document', async () => {
    const compiler = new DocumentCompiler({
      cwd: __dirname,
      input: {
        language: 'ts',
        sourceFile: __dirname + '/fixtures/page.tml'
      },
      output: {
        rootPath: path.join(__dirname, 'build'),
        componentPath: 'components',
        tsConfigPath: path.join(__dirname, '../tsconfig.json'),
      }
    });

    const template = await compiler.compile();

    console.log('Results', template({
      title: 'Hello World',
      description: 'This is a description',
      value: "123"
    }));
  }).timeout(10000);
});