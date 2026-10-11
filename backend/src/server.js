import express from 'express';
import { createApp } from './app.js';
import { createDemoRouter } from './demo.js';

const port = Number(process.env.PORT || 4000);
const server = express();
// Demo is isolated and mounted before the real app's auth guards.
server.use('/demo', createDemoRouter());
server.use(createApp());
server.listen(port, '0.0.0.0', () => console.log(`Kabadiwala API on http://localhost:${port}`));
