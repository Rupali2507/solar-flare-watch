import { BarChart2, Database, Activity, AlertTriangle, HelpCircle, FileText, Shield, Sun, Moon, Book } from 'lucide-react'
import { useState, useEffect } from 'react'

// TODO: move nav config to separate file
const pageNavMap = {
  nowcasting: [
    { key: 'nowcasting', label: 'Dashboard', icon: BarChart2 },
    { key: 'archive', label: 'Archive', icon: Database },
    { key: 'forecasting', label: 'Forecasting', icon: Activity },
    { key: 'payload', label: 'Payload health', icon: Shield },
  ],
  forecasting: [
    { key: 'nowcasting', label: 'Dashboard', icon: BarChart2 },
    { key: 'archive', label: 'Archive', icon: Database },
    { key: 'forecasting', label: 'Forecasting', icon: Activity },
    { key: 'payload', label: 'Payload health', icon: Shield },
  ],
  payload: [
    { key: 'nowcasting', label: 'Dashboard', icon: BarChart2 },
    { key: 'payload', label: 'Payload health', icon: Shield },
    { key: 'archive', label: 'Archive', icon: Database },
    { key: 'forecasting', label: 'Forecasting', icon: Activity },
  ],
  archive: [
    { key: 'nowcasting', label: 'Dashboard', icon: BarChart2 },
    { key: 'archive', label: 'Archive', icon: Database },
    { key: 'forecasting', label: 'Forecasting', icon: Activity },
    { key: 'payload', label: 'Payload health', icon: Shield },
  ],
}

export default function Sidebar({ activePage, setActivePage }) {
  const navItems = pageNavMap[activePage] || pageNavMap.nowcasting

  // remembers theme choice across reloads — simple localStorage, nothing fancy
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    return localStorage.getItem('solexs-theme') || 'dark'
  })

  useEffect(() => {
    localStorage.setItem('solexs-theme', theme)
  }, [theme])

  return (
    <aside style={s.sidebar}>
      {/* ── instrument header ───────────────────────────────────────── */}
      <div style={s.instrument}>
        <div style={s.instrumentRow}>
          <div>
            <div style={s.instrumentName}>SOLEXS-A1</div>
            <div style={s.instrumentDesc}>Solar monitoring payload</div>
          </div>
        </div>
        <div style={s.statusPill}>
          {/* temporary status indicator until websocket integration is done */}
          <span style={s.statusDot} />
          <span style={s.statusText}>online</span>
        </div>
        <div style={s.buildRow}>
          <span>v0.9.3-rc</span>
          <span style={{ margin: '0 5px' }}>·</span>
          <span>refresh 5s</span>
        </div>
        <div style={s.syncedRow}>last synced 12s ago</div>
      </div>

      {activePage === 'forecasting' && (
        <div style={s.sectionLabel}>Operations</div>
      )}

      <div style={s.section}>
        {navItems.map(item => (
          <div
            key={item.key}
            style={s.navItem(activePage === item.key)}
            onMouseEnter={(e) => { if (activePage !== item.key) e.currentTarget.style.transform = 'translateX(2px)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateX(0px)' }}
            onClick={() => setActivePage(item.key)}
          >
            <item.icon size={14} color={activePage === item.key ? '#3b82f6' : '#9ca3af'} />
            <span style={s.navLabel(activePage === item.key)}>{item.label}</span>
          </div>
        ))}
      </div>

      <div style={{ flexGrow: 1 }} />

      {/* alert center — was "EMERGENCY PROTOCOL", toned down for real use */}
      <div style={{ padding: '0 0 6px' }}>
        <div style={s.emergency}>
          <AlertTriangle size={13} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={s.emergencyLabel}>Alert center</div>
            <div style={s.emergencySub}>Last triggered: never</div>
          </div>
        </div>
      </div>

      {/* wasn't sure if users need logs here but keeping it for now */}
      <div style={s.bottomLinks}>
        <div style={s.utilItem}>
          <HelpCircle size={13} strokeWidth={1.75} color="#9ca3af" />
          <span style={s.utilLabel}>Support</span>
        </div>
        <div style={s.utilItem}>
          <FileText size={13} strokeWidth={1.75} color="#9ca3af" />
          <span style={s.utilLabel}>Logs</span>
        </div>
        <div style={s.utilItem}>
          <Book size={13} strokeWidth={1.75} color="#9ca3af" />
          <span style={s.utilLabel}>Documentation</span>
        </div>

        {/* theme toggle — simple switch, nothing animated */}
        <div style={s.themeRow}>
          <span style={s.utilLabel}>Theme</span>
          <div
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            style={s.toggleTrack(theme === 'dark')}
          >
            <div style={s.toggleThumb(theme === 'dark')}>
              {theme === 'dark' ? <Moon size={9} /> : <Sun size={9} />}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

// revisit mobile sidebar behavior later
// hackathon demo requirement — spacing isn't perfectly even everywhere, ran out of time to normalize

const s = {
  sidebar: {
    width: 222, background: '#15161b', borderRight: '1px solid #2a2d36',
    display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden',
    fontFamily: "Inter, 'Segoe UI', Roboto, sans-serif",
  },

  instrument: {
    padding: '18px 16px 14px',
    borderBottom: '1px solid #2a2d36',
  },
  instrumentRow: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  instrumentName: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
    color: '#f3f4f6',
  },
  instrumentDesc: {
    fontSize: 11, color: '#9ca3af', marginTop: 2,
  },
  statusPill: {
    display: 'flex', alignItems: 'center', gap: 5, marginTop: 10,
    background: '#1d1f26', border: '1px solid #2a2d36', borderRadius: 12,
    padding: '3px 9px', width: 'fit-content',
  },
  statusDot: {
    width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0,
  },
  statusText: { fontSize: 11, color: '#9ca3af' },
  buildRow: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#9ca3af',
    marginTop: 8,
  },
  syncedRow: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: '#6b7280',
    marginTop: 3,
  },

  section: { padding: '10px 0 6px' },
  sectionLabel: {
    fontSize: 11, color: '#9ca3af', padding: '10px 16px 4px',
  },

  navItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: active ? '9px 16px 9px 14px' : '8px 16px',
    cursor: 'pointer',
    background: active ? '#1d1f26' : 'transparent',
    borderLeft: active ? '2px solid #3b82f6' : '2px solid transparent',
    transition: 'background 0.15s ease, transform 0.15s ease',
  }),
  navLabel: (active) => ({
    fontSize: 13,
    color: active ? '#f3f4f6' : '#9ca3af',
  }),

  emergency: {
    margin: '8px 12px', padding: '9px 12px',
    background: '#1d1f26', border: '1px solid rgba(239,68,68,0.35)',
    borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 8,
  },
  emergencyLabel: {
    fontSize: 12, color: '#ef4444', fontWeight: 600,
  },
  emergencySub: {
    fontSize: 11, color: '#9ca3af', marginTop: 1,
  },

  bottomLinks: { padding: '6px 0 12px', borderTop: '1px solid #2a2d36', marginTop: 4 },
  utilItem: {
    display: 'flex', alignItems: 'center', gap: 9, padding: '7px 16px',
    cursor: 'pointer', transition: 'background 0.15s ease',
  },
  utilLabel: { fontSize: 12, color: '#9ca3af' },

  themeRow: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '9px 16px 2px',
  },
  toggleTrack: (isDark) => ({
    width: 32, height: 18, borderRadius: 10,
    background: isDark ? '#3b82f6' : '#2a2d36',
    position: 'relative', cursor: 'pointer', transition: 'background 0.15s ease',
  }),
  toggleThumb: (isDark) => ({
    width: 14, height: 14, borderRadius: '50%', background: '#f3f4f6',
    position: 'absolute', top: 2, left: isDark ? 16 : 2,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#15161b', transition: 'left 0.15s ease',
  }),
}