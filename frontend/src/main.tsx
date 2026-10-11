import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './styles/globals.css'
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
      <div className="min-h-screen bg-surface p-6 text-foreground">
        <h2>Clerk key missing</h2>
        <p>
          The dev server bakes env vars in at startup, so if it was started <em>before</em>{' '}
          <code>frontend/.env</code> existed, saving files (HMR) will keep showing this screen.
        </p>
        <p>
          Create <code>frontend/.env</code> with:
        </p>
        <pre>VITE_CLERK_PUBLISHABLE_KEY=pk_test_...</pre>
        <p>
          Then fully stop the server (<code>Ctrl+C</code>) and run <code>npm run dev</code> again
          from the <code>frontend/</code> folder — and open the URL the server prints (check the
          port, e.g. <code>:5173</code> vs <code>:5174</code>).
        </p>
      </div>
    )}
  </StrictMode>,
)
