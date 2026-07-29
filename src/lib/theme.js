// Light/dark theme is a simple, self-contained preference stored in
// localStorage (default: dark). This module has no React dependency so it
// can be called from main.jsx before the app even renders, to set the
// theme attribute on <html> as early as possible and avoid a flash of the
// wrong theme for anyone who has chosen light mode.

const THEME_KEY = 'mut.theme.v1'

export function getStoredTheme() {
  try {
    const raw = window.localStorage.getItem(THEME_KEY)
    return raw === 'light' || raw === 'dark' ? raw : null
  } catch {
    return null
  }
}

export function storeTheme(theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme)
  } catch {
    // localStorage unavailable (private browsing, etc.) - theme just won't
    // persist across visits, which is a fine fallback.
  }
}

// Dark is the default look for the site, so anyone with no saved
// preference yet gets dark.
export function getInitialTheme() {
  return getStoredTheme() || 'dark'
}

export function applyThemeAttribute(theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme)
  }
}
