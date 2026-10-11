import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { createDemoRouter } from './demo.js';

const app = express();
const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, '../../frontend/dist');
const port = Number(process.env.PORT || 4000);

app.set('trust proxy', 'loopback');
app.use('/demo', createDemoRouter());
app.use('/api', createApp());
app.use(express.static(dist));
app.use((req, res, next) => {
  if (req.method !== 'GET' || !req.accepts('html')) return next();
  res.sendFile(path.join(dist, 'index.html'));
});
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.listen(port, '127.0.0.1', () => console.log('Kabadiwala listening on port ' + port));