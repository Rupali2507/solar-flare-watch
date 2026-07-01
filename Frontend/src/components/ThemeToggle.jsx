import { useTheme } from '../useTheme'
// import { useTheme } from '../hooks/useTheme'
// simple sun/moon icons drawn by hand instead of pulling in an icon
// library just for two icons — felt like overkill for this
function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="4.5" />
      <line x1="12" y1="1.5" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="22.5" />
      <line x1="3.5" y1="12" x2="1" y2="12" />
      <line x1="23" y1="12" x2="20.5" y2="12" />
      <line x1="5" y1="5" x2="6.8" y2="6.8" />
      <line x1="17.2" y1="17.2" x2="19" y2="19" />
      <line x1="19" y1="5" x2="17.2" y2="6.8" />
      <line x1="6.8" y1="17.2" x2="5" y2="19" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 14.5a8.5 8.5 0 0 1-10.6-10.4 8.5 8.5 0 1 0 10.6 10.4z" />
    </svg>
  )
}

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode (or press T)`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 10px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        color: 'var(--text-dim)',
        fontSize: 11.5,
        fontFamily: 'var(--font)',
        cursor: 'pointer',
      }}
      // quick hover effect done inline since this is a one-off button,
      // didn't want to make a whole CSS class for it
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {isDark ? <MoonIcon /> : <SunIcon />}
      {isDark ? 'dark' : 'light'}
      <span style={{ color: 'var(--text-faint)', marginLeft: 2 }}>· T</span>
    </button>
  )
}