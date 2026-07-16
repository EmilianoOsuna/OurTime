import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { setupNativeApp } from './lib/native'

// Puente de regreso desde Stripe (nativo): Stripe exige success_url https, así
// que abre esta web dentro del navegador in-app con `close_native=1`; aquí
// rebotamos al esquema ourtime:// para que la app cierre el navegador y refresque.
const bridgeParams = new URLSearchParams(window.location.search)
if (bridgeParams.get('close_native') === '1') {
  bridgeParams.delete('close_native')
  window.location.href = `ourtime://callback?${bridgeParams.toString()}`
} else {
  setupNativeApp()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
