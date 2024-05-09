import express from 'express';
import temple from 'temple';

const app = express();
const render = temple({ cwd: __dirname });

app.get('/foo/bar/zoo', (req, res) => {
  const results = render('/foo/bar/zoo', './templates/page.tml', {
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