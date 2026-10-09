import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.tsx'

// Clerk publishable key (public, safe in the frontend). Put it in frontend/.env - see README.
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
        <h2>Clerk key missing</h2>
        <p>Create <code>frontend/.env</code> with:</p>
        <pre>VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</pre>
        <p>Then restart <code>npm run dev</code>.</p>
      </div>
    )}
  </StrictMode>,
)
