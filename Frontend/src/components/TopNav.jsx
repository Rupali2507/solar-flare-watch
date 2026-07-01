import { Bell, Settings } from 'lucide-react'

// TODO: pull nav items from same config sidebar uses, duplicated for now
const navItems = [
  { key: 'nowcasting', label: 'Nowcasting' },
  { key: 'forecasting', label: 'Forecasting' },
  { key: 'payload', label: 'Payload' },
  { key: 'archive', label: 'Archive' },
]

export default function TopNav({ activePage, setActivePage }) {
  const isAlert = activePage === 'forecasting'

  return (
    <nav style={s.nav}>
      <span style={s.logo}>Helios mission control</span>

      <div style={s.navLinks}>
        {navItems.map((item, i) => (
          <button
            key={item.key}
            style={s.navLink(activePage === item.key, i)}
            onClick={() => setActivePage(item.key)}
            onMouseEnter={(e) => {
              if (activePage !== item.key) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
            }}
            onMouseLeave={(e) => {
              if (activePage !== item.key) e.currentTarget.style.background = 'transparent'
            }}
          >
            {item.label}
            {/* small active indicator bar, not a glowing underline */}
            <span style={s.activeBar(activePage === item.key)} />
          </button>
        ))}
      </div>

      {/* right side actions — grew organically, not perfectly grouped */}
      <div style={s.right}>
        {/* monitoring status chip, was "GOES-18 LIVE" with a pulse animation */}
        <div style={s.statusChip(isAlert)}>
          <span style={s.statusDot(isAlert)} />
          <span style={s.statusLabel}>GOES-18</span>
          <span style={s.statusDivider}>·</span>
          <span style={s.statusRefresh}>synced 4s ago</span>
        </div>

        <div style={s.iconGroup}>
          <button style={s.iconBtn}><Settings size={15} /></button>
          <button style={s.iconBtn}>
            <Bell size={15} color={isAlert ? '#ef4444' : '#9ca3af'} />
          </button>
        </div>

        {/* keeping initials avatar, gradient felt unnecessary */}
        <div style={s.avatar}>SC</div>
      </div>
    </nav>
  )
}

const s = {
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 22px 0 26px', height: 54, background: '#1d1f26',
    borderBottom: '1px solid #2b2e38', flexShrink: 0, zIndex: 100,
    fontFamily: "Inter, 'Segoe UI', Roboto, sans-serif",
  },

  // logo area slightly larger / weightier than nav links
  logo: {
    fontSize: 15, fontWeight: 600,
    color: '#f3f4f6', marginRight: 36, flexShrink: 0,
  },

  navLinks: { display: 'flex', gap: 22, alignItems: 'center', flexGrow: 1 },
  navLink: (active, i) => ({
    position: 'relative',
    fontSize: 13,
    color: active ? '#f3f4f6' : '#9ca3af',
    cursor: 'pointer', background: 'transparent', border: 'none',
    padding: i % 2 === 0 ? '6px 9px' : '6px 8px',
    borderRadius: 5,
    transition: 'background 0.15s ease, color 0.15s ease, opacity 0.15s ease',
  }),
  activeBar: (active) => ({
    position: 'absolute', left: 8, right: 8, bottom: -1, height: 2,
    borderRadius: 1,
    background: active ? '#3b82f6' : 'transparent',
  }),

  right: { display: 'flex', alignItems: 'center', gap: 14 },

  // monitoring status chip
  statusChip: (alert) => ({
    display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
    background: alert ? 'rgba(239,68,68,0.08)' : '#15161b',
    border: `1px solid ${alert ? 'rgba(239,68,68,0.35)' : '#2b2e38'}`,
    borderRadius: 6,
  }),
  statusDot: (alert) => ({
    width: 6, height: 6, borderRadius: '50%',
    background: alert ? '#ef4444' : '#22c55e', flexShrink: 0,
  }),
  statusLabel: {
    fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#f3f4f6',
  },
  statusDivider: { fontSize: 11, color: '#6b7280' },
  statusRefresh: {
    fontSize: 11, color: '#9ca3af',
  },

  // icons grouped closer together, separate from status chip and avatar
  iconGroup: { display: 'flex', alignItems: 'center', gap: 2 },
  iconBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#9ca3af', padding: 6, borderRadius: 5, display: 'flex',
    transition: 'background 0.15s ease',
  },

  avatar: {
    width: 27, height: 27, borderRadius: '50%',
    background: '#2b2e38', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 600, color: '#9ca3af',
    marginLeft: 2,
  },
}