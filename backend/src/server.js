import { createApp } from './app.js';
const port = Number(process.env.PORT || 4000);
createApp().listen(port, '0.0.0.0', () => console.log(`Kabadiwala API on http://localhost:${port}`));
