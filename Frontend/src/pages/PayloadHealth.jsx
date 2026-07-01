import { AreaChart, Area, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { RefreshCw, Download, Settings, Zap, Star, Info, AlertTriangle, CheckCircle2, Bug, Moon, Sun } from 'lucide-react'
import { useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND CONNECTION POINTS:
// 1. GET /api/payload/telemetry               → orbitPosition, distanceFromEarth, downlinkBitrate, pradan status
// 2. WS  /ws/payload/telemetry               → real-time telemetry updates
// 3. GET /api/payload/subsystems              → subsystem go/no-go status list
// 4. GET /api/payload/solexs/metrics          → SoLEXS temp, busVoltage, throughput
// 5. GET /api/payload/helios/metrics          → HEL1OS temp, busVoltage, throughput
// 6. WS  /ws/payload/solexs/curve            → SoLEXS sensitivity curve stream
// 7. WS  /ws/payload/helios/flux             → HEL1OS flux stability index stream
// 8. GET /api/payload/calibration-logs        → calibration log entries (paginated)
// 9. POST /api/payload/recalibrate            → trigger force recalibration
// 10. GET /api/payload/sensitivity-settings   → current sensitivity configuration
// POST /api/payload/sensitivity-settings      → update sensitivity settings
// ─────────────────────────────────────────────────────────────────────────────

// TODO: replace dummy telemetry stream once the WS endpoint is actually live
// these timestamps are fake — backend team still working on that endpoint
const solexsCurve = [
  { t: '08:40', v: 0.21 }, { t: '08:41', v: 0.34 }, { t: '08:42', v: 0.61 }, { t: '08:43', v: 0.88 },
  { t: '08:44', v: 1.02 }, { t: '08:45', v: 0.79 }, { t: '08:46', v: 0.52 }, { t: '08:47', v: 0.31 },
  { t: '08:48', v: 0.42 }, { t: '08:49', v: 0.58 }, { t: '08:50', v: 0.49 }, { t: '08:51', v: 0.33 },
]
const heliosCurve = [
  { t: '08:40', v: 0.31 }, { t: '08:41', v: 0.48 }, { t: '08:42', v: 0.71 }, { t: '08:43', v: 0.92 },
  { t: '08:44', v: 1.01 }, { t: '08:45', v: 0.84 }, { t: '08:46', v: 0.61 }, { t: '08:47', v: 0.49 },
  { t: '08:48', v: 0.57 }, { t: '08:49', v: 0.69 }, { t: '08:50', v: 0.58 }, { t: '08:51', v: 0.41 },
]

// BACKEND: from GET /api/payload/calibration-logs
// mapped INFO/WARN/SUCCESS/DEBUG onto our 4 severity colors — DEBUG just rides along with info styling for now
const calLogs = [
  { time: '08:24:12', level: 'INFO', title: 'Auto-cal sequence started', desc: 'Sequence 4A-32 initiated on schedule.' },
  { time: '08:25:55', level: 'WARN', title: 'Gain drift detected', desc: 'HEL1OS bias adjustment triggered automatically.' },
  { time: '08:26:01', level: 'SUCCESS', title: 'Bias adjustment complete', desc: 'SNR stabilized, back within nominal range.' },
  { time: '08:32:44', level: 'INFO', title: 'Downlink channel switched', desc: 'Now routing through PRADAN channel 2.' },
  { time: '08:45:10', level: 'DEBUG', title: 'Frame integrity check passed', desc: '100% of frames OK, no retransmits needed.' },
  { time: '08:50:12', level: 'INFO', title: 'SoLEXS shadow mode off', desc: 'Instrument back to normal observing mode.' },
  { time: '09:02:18', level: 'WARN', title: 'High energy particle flux', desc: 'Increasing shielding margin as a precaution.' },
]

const subsystems = [
  // BACKEND: from GET /api/payload/subsystems
  { name: 'Power array AD1', status: 'Nominal', ok: true },
  { name: 'Antenna pointing', status: 'Nominal', ok: true },
  { name: 'Thermal shield', status: 'Warning', ok: false },
  { name: 'Cryogenic cooler', status: 'Nominal', ok: true },
]

// colors — picked these to look like an actual engineering tool, not a sci-fi HUD
const C = {
  bg: '#15161b',
  card: '#1d1f26',
  panel: '#23262f',
  border: '#2d2f38',
  accent: '#3b82f6',
  success: '#22c55e',
  warning: '#eab308',
  error: '#ef4444',
  info: '#3b82f6',
  text: '#e6e7eb',
  textDim: '#9aa0ab',
  textFaint: '#6b7280',
}

const FONT = "'Inter', 'Segoe UI', Roboto, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

const severityMeta = {
  INFO: { color: C.info, Icon: Info, label: 'info' },
  WARN: { color: C.warning, Icon: AlertTriangle, label: 'warning' },
  SUCCESS: { color: C.success, Icon: CheckCircle2, label: 'success' },
  DEBUG: { color: C.textDim, Icon: Bug, label: 'debug' },
}

// rough estimate, not pulled from backend yet — placeholder until the regions endpoint exists
const activeRegions = [
  { name: 'AR13872', probability: 72, confidence: 89, status: 'Elevated activity', lastObs: '08:51 UTC' },
  { name: 'AR13869', probability: 34, confidence: 76, status: 'Stable', lastObs: '08:47 UTC' },
]

const s = {
  page: { padding: '24px 20px 40px', display: 'flex', flexDirection: 'column', gap: 18, background: C.bg, fontFamily: FONT, color: C.text, minHeight: '100vh' },

  // nav — simple, not flashy
  nav: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: `1px solid ${C.border}` },
  navLeft: { display: 'flex', gap: 18, alignItems: 'center' },
  navItem: (active) => ({
    fontSize: 13, color: active ? C.text : C.textDim, cursor: 'pointer', paddingBottom: 4,
    borderBottom: active ? `2px solid ${C.accent}` : '2px solid transparent', transition: 'color .15s ease, border-color .15s ease',
  }),
  themeToggle: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.textDim, cursor: 'pointer', padding: '5px 10px', border: `1px solid ${C.border}`, borderRadius: 5 },

  topCard: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '20px 22px', boxShadow: '0 2px 8px rgba(0,0,0,.18)' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 12 },
  title: { fontSize: 20, fontWeight: 600, color: C.text },
  subtitle: { fontSize: 12, color: C.textFaint, marginTop: 4 },
  statusChips: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  chip: (color, bg) => ({
    display: 'flex', flexDirection: 'column', gap: 2, padding: '7px 14px',
    background: bg, border: `1px solid ${color}33`, borderRadius: 6, fontSize: 11, color: C.textDim,
  }),
  chipDot: (color) => ({ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', marginRight: 6 }),

  orbitRow: { display: 'grid', gridTemplateColumns: '1fr 260px', gap: 14 },
  orbitViz: {
    background: '#0e0f14', border: `1px solid ${C.border}`, borderRadius: 8,
    height: 210, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  orbitLabel: { position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' },
  orbitValue: { fontFamily: MONO, fontSize: 17, color: C.text, fontWeight: 600 },
  orbitSub: { fontSize: 10, color: C.textFaint, marginTop: 2 },
  orbitTag: { position: 'absolute', top: 10, left: 12, fontSize: 10, color: C.textFaint },

  subsysCard: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px' },
  subsysTitle: { fontSize: 12, color: C.textDim, marginBottom: 10, fontWeight: 500 },
  subsysRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: `1px solid ${C.border}` },
  subsysName: { fontSize: 12, color: C.text },
  subsysStatus: (ok) => ({ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: ok ? C.success : C.warning }),

  instrRow: { display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14 },
  instrCard: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '18px 20px', transition: 'transform .2s ease, box-shadow .2s ease', boxShadow: '0 1px 4px rgba(0,0,0,.15)' },
  instrHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  instrTitle: { fontSize: 16, fontWeight: 600, color: C.text },
  instrSub: { fontSize: 11, color: C.textFaint, marginTop: 2 },
  metricsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 },
  metric: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 5, padding: '8px 10px' },
  metricLabel: { fontSize: 10, color: C.textFaint },
  metricValue: { fontFamily: MONO, fontSize: 15, color: C.text, fontWeight: 600, marginTop: 3 },
  curveLabel: { fontSize: 11, color: C.textDim, marginBottom: 4 },
  refreshNote: { fontSize: 10, color: C.textFaint, marginTop: 6, textAlign: 'right' },

  bottomRow: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14, alignItems: 'start' },
  logCard: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 16px 8px' },
  logHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  logTitle: { fontSize: 13, color: C.text, fontWeight: 600 },
  logList: { maxHeight: 280, overflowY: 'auto', paddingRight: 4 },
  logEntry: { display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid ${C.border}` },
  logTime: { fontFamily: MONO, fontSize: 10, color: C.textFaint, flexShrink: 0, width: 58, marginTop: 2 },
  logTitleText: { fontSize: 12, color: C.text, fontWeight: 500 },
  logDesc: { fontSize: 11, color: C.textDim, marginTop: 2, lineHeight: 1.4 },

  regionsCard: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 18px' },
  regionsTitle: { fontSize: 13, color: C.text, fontWeight: 600, marginBottom: 12 },
  regionGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  regionCard: { background: C.panel, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 12px' },
  regionName: { fontFamily: MONO, fontSize: 12, color: C.text, fontWeight: 600 },
  regionRow: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.textDim, marginTop: 4 },

  schematicCard: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 18px', display: 'flex', flexDirection: 'column', marginTop: 14 },
  schematicTitle: { fontSize: 12, color: C.textDim, marginBottom: 8 },
  schematicViz: { background: '#0e0f14', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 150 },
  actionRow: { display: 'flex', gap: 10, marginTop: 12 },
  actionBtn: (primary) => ({
    flex: 1, padding: '9px 0', textAlign: 'center', cursor: 'pointer', borderRadius: 5,
    fontSize: 12, transition: 'transform .15s ease, box-shadow .15s ease',
    background: primary ? C.accent : 'transparent',
    border: `1px solid ${primary ? C.accent : C.border}`,
    color: primary ? '#fff' : C.textDim,
  }),
}

// custom tooltip — recharts default looked too generic, made our own
function TelemetryTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 5, padding: '6px 10px', fontSize: 11 }}>
      <div style={{ color: C.textFaint, marginBottom: 2 }}>{label} UTC</div>
      <div style={{ fontFamily: MONO, color: C.text }}>{payload[0].value.toFixed(2)}</div>
    </div>
  )
}

export default function PayloadHealth() {
  const [dark, setDark] = useState(true)
  // not wiring this up to anything real yet, just toggling local state for the demo
  const [activeTab, setActiveTab] = useState('payload')

  return (
    <div style={s.page}>
      {/* simple nav, nothing fancy */}
      

      {/* Header section */}
      <div style={s.topCard}>
        <div style={s.topRow}>
          <div>
            <div style={s.title}>Payload health &amp; telemetry</div>
            {/* BACKEND: architecture details from /api/payload/telemetry */}
            <div style={s.subtitle}>Aditya-L1 · Lagrange point 1 · payload subsystem monitor</div>
          </div>
          <div style={s.statusChips}>
            {/* BACKEND: PRADAN connection status from /api/payload/telemetry → pradanStatus */}
            <div style={s.chip(C.success, 'rgba(34,197,94,0.08)')}>
              <span><span style={s.chipDot(C.success)} />ISSDC PRADAN</span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: C.text }}>Connected</span>
            </div>
            {/* BACKEND: bitrate from /api/payload/telemetry → downlinkBitrateGbps */}
            <div style={s.chip(C.accent, 'rgba(59,130,246,0.08)')}>
              <span><Download size={11} style={{ verticalAlign: 'middle', marginRight: 4 }} />Downlink bitrate</span>
              <span style={{ fontFamily: MONO, fontSize: 13, color: C.text }}>4.2 Gbps</span>
            </div>
          </div>
        </div>

        <div style={s.orbitRow}>
          {/* BACKEND: orbital trajectory from /api/payload/telemetry → orbitPosition {x, y} */}
          <div style={s.orbitViz}>
            <div style={s.orbitTag}>L1 orbit trajectory</div>
            <svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid meet">
              <path d="M 20 160 Q 200 20, 380 160" fill="none" stroke="#2a2d38" strokeWidth="1" />
              <rect x="175" y="70" width="50" height="35" rx="3" fill="none" stroke="#3a3e4a" strokeWidth="1.5" />
              <rect x="140" y="80" width="35" height="15" rx="2" fill="none" stroke="#454a58" strokeWidth="1" />
              <rect x="225" y="80" width="35" height="15" rx="2" fill="none" stroke="#454a58" strokeWidth="1" />
              <circle cx="200" cy="70" r="4" fill={C.accent} />
              <circle cx="360" cy="160" r="8" fill="none" stroke="#2a2d38" strokeWidth="1.5" />
              <circle cx="360" cy="160" r="4" fill="#1c2230" />
            </svg>
            <div style={s.orbitLabel}>
              {/* BACKEND: distance from /api/payload/telemetry → distanceKm */}
              <div style={s.orbitValue}>1,482,000 km</div>
              <div style={s.orbitSub}>distance from Earth surface</div>
            </div>
          </div>

          <div style={s.subsysCard}>
            <div style={s.subsysTitle}>Subsystem status</div>
            {/* BACKEND: each status from /api/payload/subsystems */}
            {subsystems.map(sub => (
              <div key={sub.name} style={s.subsysRow}>
                <span style={s.subsysName}>{sub.name}</span>
                <span style={s.subsysStatus(sub.ok)}>
                  {sub.status}
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: sub.ok ? C.success : C.warning, display: 'inline-block' }} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Instrument cards — deliberately not the same height, SoLEXS card runs a bit taller */}
      <div style={s.instrRow}>
        <div
          style={s.instrCard}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,.25)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.15)' }}
        >
          <div style={s.instrHeader}>
            <div>
              <div style={s.instrTitle}>SoLEXS</div>
              <div style={s.instrSub}>Solar low energy X-ray spectrometer</div>
            </div>
            <Zap size={16} color={C.accent} />
          </div>
          {/* BACKEND: metrics from /api/payload/solexs/metrics */}
          <div style={s.metricsRow}>
            <div style={s.metric}><div style={s.metricLabel}>Temperature</div><div style={s.metricValue}>-42.5°C</div></div>
            <div style={s.metric}><div style={s.metricLabel}>Bus voltage</div><div style={s.metricValue}>28.02 V</div></div>
            <div style={s.metric}><div style={s.metricLabel}>Throughput</div><div style={s.metricValue}>124 KB/s</div></div>
          </div>
          <div style={s.curveLabel}>Sensitivity curve — channel A1</div>
          {/* BACKEND: curve data from WS /ws/payload/solexs/curve */}
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={solexsCurve} margin={{ top: 5, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="solGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.accent} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              {/* dropped the grid lines, made it too noisy at this size */}
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: C.textFaint, fontFamily: MONO }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: C.textFaint, fontFamily: MONO }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<TelemetryTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: C.textDim }} formatter={() => 'sensitivity index'} />
              <Area type="monotone" dataKey="v" name="sensitivity index" stroke={C.accent} fill="url(#solGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={s.refreshNote}>updated every 5 sec</div>
        </div>

        <div
          style={s.instrCard}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,0,0,.25)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.15)' }}
        >
          <div style={s.instrHeader}>
            <div>
              <div style={s.instrTitle}>HEL1OS</div>
              <div style={s.instrSub}>High energy L1 orbiting X-ray spectrometer</div>
            </div>
            <Star size={16} color={C.accent} />
          </div>
          {/* BACKEND: metrics from /api/payload/helios/metrics */}
          <div style={s.metricsRow}>
            <div style={s.metric}><div style={s.metricLabel}>Temperature</div><div style={s.metricValue}>-38.1°C</div></div>
            <div style={s.metric}><div style={s.metricLabel}>Bus voltage</div><div style={s.metricValue}>27.98 V</div></div>
            <div style={s.metric}><div style={s.metricLabel}>Throughput</div><div style={s.metricValue}>850 KB/s</div></div>
          </div>
          <div style={s.curveLabel}>Flux stability index</div>
          {/* BACKEND: flux stability index from WS /ws/payload/helios/flux */}
          {/* wasn't sure if this metric helps day-to-day, keeping it for now since ops team asked for it */}
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={heliosCurve} margin={{ top: 5, right: 8, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="helGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.accent} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" tick={{ fontSize: 9, fill: C.textFaint, fontFamily: MONO }} axisLine={{ stroke: C.border }} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: C.textFaint, fontFamily: MONO }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<TelemetryTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: C.textDim }} formatter={() => 'flux stability'} />
              <Area type="monotone" dataKey="v" name="flux stability" stroke={C.accent} fill="url(#helGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div style={s.refreshNote}>updated every 5 sec</div>
        </div>
      </div>

      {/* Calibration logs (timeline style) + region cards / schematic */}
      <div style={s.bottomRow}>
        <div style={s.logCard}>
          <div style={s.logHeader}>
            <span style={s.logTitle}>Calibration logs</span>
            {/* BACKEND: refresh button triggers GET /api/payload/calibration-logs?since=last */}
            <RefreshCw size={13} color={C.textFaint} style={{ cursor: 'pointer' }} />
          </div>
          {/* BACKEND: entries from GET /api/payload/calibration-logs */}
          <div style={s.logList}>
            {calLogs.map((log, i) => {
              const meta = severityMeta[log.level] || severityMeta.INFO
              const { Icon } = meta
              return (
                <div key={i} style={s.logEntry}>
                  <span style={s.logTime}>{log.time}</span>
                  <Icon size={14} color={meta.color} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={s.logTitleText}>{log.title}</div>
                    <div style={s.logDesc}>{log.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          {/* region cards — replaced the old placeholder indicators with these */}
          <div style={s.regionsCard}>
            <div style={s.regionsTitle}>Active regions</div>
            <div style={s.regionGrid}>
              {/* BACKEND: region probabilities from forecast model — endpoint TBD, using rough estimate for now */}
              {activeRegions.map(r => (
                <div key={r.name} style={s.regionCard}>
                  <div style={s.regionName}>{r.name}</div>
                  <div style={s.regionRow}><span>flare probability</span><span style={{ fontFamily: MONO, color: C.text }}>{r.probability}%</span></div>
                  <div style={s.regionRow}><span>confidence</span><span style={{ fontFamily: MONO, color: C.text }}>{r.confidence}%</span></div>
                  <div style={s.regionRow}><span>status</span><span style={{ color: r.status === 'Elevated activity' ? C.warning : C.success }}>{r.status}</span></div>
                  <div style={s.regionRow}><span>last observation</span><span style={{ fontFamily: MONO }}>{r.lastObs}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div style={s.schematicCard}>
            <div style={s.schematicTitle}>Aditya-L1 payload map</div>
            {/* BACKEND: schematic image or SVG from /api/payload/schematic or static asset */}
            <div style={s.schematicViz}>
              <svg width="200" height="140" viewBox="0 0 220 150">
                <rect x="70" y="50" width="80" height="50" rx="4" fill="none" stroke="#3a3e4a" strokeWidth="1.5" />
                <rect x="10" y="62" width="55" height="26" rx="3" fill="none" stroke="#2a2d38" strokeWidth="1" />
                <line x1="27" y1="62" x2="27" y2="88" stroke="#1c1e26" strokeWidth="0.5" />
                <line x1="44" y1="62" x2="44" y2="88" stroke="#1c1e26" strokeWidth="0.5" />
                <rect x="155" y="62" width="55" height="26" rx="3" fill="none" stroke="#2a2d38" strokeWidth="1" />
                <line x1="172" y1="62" x2="172" y2="88" stroke="#1c1e26" strokeWidth="0.5" />
                <line x1="189" y1="62" x2="189" y2="88" stroke="#1c1e26" strokeWidth="0.5" />
                <line x1="110" y1="50" x2="110" y2="25" stroke="#3a3e4a" strokeWidth="1" />
                <circle cx="110" cy="22" r="5" fill="none" stroke={C.accent} strokeWidth="1" />
                <text x="75" y="42" fill={C.textFaint} fontSize="7" fontFamily={FONT}>SoLEXS</text>
                <text x="128" y="42" fill={C.textFaint} fontSize="7" fontFamily={FONT}>HEL1OS</text>
                <circle cx="85" cy="75" r="4" fill={C.accent} opacity="0.6" />
                <circle cx="135" cy="75" r="4" fill={C.accent} opacity="0.6" />
              </svg>
            </div>
            <div style={s.actionRow}>
              {/* BACKEND: Sensitivity Settings → GET/POST /api/payload/sensitivity-settings */}
              <button
                style={s.actionBtn(false)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
              >
                <Settings size={11} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                Sensitivity settings
              </button>
              {/* BACKEND: Force Recalibrate → POST /api/payload/recalibrate */}
              <button
                style={s.actionBtn(true)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
              >
                Force recalibration
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* temporary styling on a few elements above, revisit spacing once real data is wired in */}
    </div>
  )
}