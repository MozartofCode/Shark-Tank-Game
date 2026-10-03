import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Privacy-friendly analytics (no cookies), only when configured.
const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined
if (plausibleDomain) {
  const script = document.createElement('script')
  script.defer = true
  script.dataset.domain = plausibleDomain
  script.src = 'https://plausible.io/js/script.js'
  document.head.appendChild(script)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
