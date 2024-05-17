import express from 'express';
import { temple } from '@dec0de-io/temple';

const app = express();
const template = temple({
  buildPath: '../.temple',
  cwd: __dirname,
  useCache: true
});

app.get('/foo/bar/zoo', async (req, res) => {
  const render = await template('./templates/page.tml');
  const results = render({
    title: 'This is Header 1',
    description: 'This is Paragraph',
    value: 0
  });
  res.type('text/html');
  res.send(results);
});

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});