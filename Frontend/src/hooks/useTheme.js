import { useState, useEffect } from 'react'

// pulled this into its own hook mostly so App.jsx doesn't get cluttered.
// nothing fancy here — just a useState that's synced to localStorage
// and to a data-theme attribute on <html> (that's what theme.css reads)

const STORAGE_KEY = 'hel1os-theme' // prefixed so it doesn't clash with other projects in localStorage

export function useTheme() {
  // default to dark on first load (matches requirement: dark is default),
  // but if the user already picked something before, remember it
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'dark'
  })

  // whenever theme changes, update the <html data-theme="..."> attribute
  // (this is what actually triggers the CSS variables to swap, see theme.css)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  // keyboard shortcut: press "T" to toggle
  // skipping it if user is typing in an input/textarea so it doesn't
  // randomly flip the theme while someone's typing a search query etc
  useEffect(() => {
    function handleKeyDown(e) {
      const tag = document.activeElement?.tagName
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA'
      if (!isTyping && (e.key === 't' || e.key === 'T')) {
        toggleTheme()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { theme, toggleTheme }
}