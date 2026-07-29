import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import { getInitialTheme, applyThemeAttribute } from './lib/theme.js'
import './index.css'

// Set the theme attribute before the first render so light-mode visitors
// don't see a flash of the (default) dark theme first.
applyThemeAttribute(getInitialTheme())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
