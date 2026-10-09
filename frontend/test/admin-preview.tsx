// Preview the admin panel WITHOUT Clerk sign-in: run `npm run dev`, open
// http://localhost:5173/test/admin-preview.html?key=admin-dev-key&tab=collectors&lang=en
import React from 'react';
import { createRoot } from 'react-dom/client';
import '../src/index.css';
import i18n from '../src/i18n';
import { AdminPanel } from '../src/pages/admin/AdminPanel';
const q = new URLSearchParams(location.search);
const key = q.get('key');
if (key) sessionStorage.setItem('kabadiwala-admin-key', key);
void i18n.changeLanguage(q.get('lang') || 'en');
createRoot(document.getElementById('root')!).render(<React.StrictMode><AdminPanel /></React.StrictMode>);
