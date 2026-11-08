import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { EditionProvider } from './edition'
import { internalEdition } from './internal'
import { SessionProvider } from './session'

// Internal app (@mastra.ai): includes costs, margins, support and programs.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SessionProvider>
      <EditionProvider value={internalEdition}>
        <App />
      </EditionProvider>
    </SessionProvider>
  </StrictMode>,
)
