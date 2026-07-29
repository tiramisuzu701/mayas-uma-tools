import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { REPO_URL } from '../siteConfig.js'
import { getInitialTheme, storeTheme, applyThemeAttribute } from '../lib/theme.js'

export default function Layout({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    applyThemeAttribute(theme)
    storeTheme(theme)
  }, [theme])

  function toggleTheme() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span className="brand-text">
            Maya's Uma Tools
          </span>
        </Link>
        <nav className="site-nav">
          <Link to="/">Home</Link>
          {REPO_URL && (
            <a href={REPO_URL} target="_blank" rel="noreferrer" title="View source on GitHub">
              GitHub
            </a>
          )}
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span key={theme} className="theme-toggle-icon" aria-hidden="true">
              {theme === 'dark' ? '🌙' : '☀️'}
            </span>
          </button>
        </nav>
      </header>

      <main className="site-main">{children}</main>

      <footer className="site-footer">
        <p>
          Maya's Uma Tools is an unofficial, fan-made project. Uma Musume: Pretty Derby
          and all related character names/art are property of Cygames, Inc. This site
          is not affiliated with or endorsed by Cygames. All data you enter is stored
          only in your own browser.
        </p>
      </footer>
    </div>
  )
}
