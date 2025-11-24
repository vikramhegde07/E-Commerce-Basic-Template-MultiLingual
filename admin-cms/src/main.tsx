import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.tsx'
import { ErrorProvider } from './context/ErrorContext.tsx'
import { LoadingProvider } from './context/LoadingContext.tsx'
import { LangProvider } from './context/LangContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <LangProvider>
        <AuthProvider>
          <ErrorProvider>
            <LoadingProvider>
              <App />
            </LoadingProvider>
          </ErrorProvider>
        </AuthProvider>
      </LangProvider>
    </BrowserRouter>
  </StrictMode>,
)
