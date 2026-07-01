import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts'

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND CONNECTION POINTS:
// 1. GET /api/nowcast/current-state        → currentState, fluxValue, solarState
// 2. GET /api/nowcast/x-class-probability  → xClassProbability (24h cumulative)
// 3. GET /api/nowcast/lead-time            → leadTime countdown (est. peak)
// 4. WS  /ws/flux-stream                   → real-time SoLEXS + HEL1OS flux data for chart
// 5. GET /api/nowcast/lead-time-analysis   → predictedOnset, peakIntensity, duration
// 6. GET /api/nowcast/active-regions       → activeRegions list (AR number, class, coords)
// 7. WS  /ws/alerts                        → live alert feed events
//
// TODO: replace dummy prediction API once the model team gives us a real endpoint
// ─────────────────────────────────────────────────────────────────────────────

const generateFluxData = () => {
  const data = []
  const times = ['12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00']
  const solexs = [0.3, 0.4, 0.55, 0.7, 0.65, 0.85, 0.9, 0.75, 0.95, 1.1, 0.85]
  const helios = [0.1, 0.12, 0.18, 0.25, 0.22, 0.3, 0.28, 0.35, 0.45, 0.55, 0.4]
  times.forEach((t, i) => data.push({ time: t, solexs: solexs[i], helios: helios[i] }))
  return data
}

// rough estimate based on previous flare events, will hook up to /ws/alerts later
const mockAlerts = [
  { type: 'M-class precursor', time: '17:42:01', sev: 'error', msg: 'Sustained intensity increase detected in HEL1OS. Confidence: 88%.' },
  { type: 'C-class detected', time: '17:35:12', sev: 'warning', msg: 'Integrated flux peak at 1.45e-6 W/m². AR2890 stable.' },
  { type: 'AR reconfiguration', time: '17:10:00', sev: 'info', msg: 'Magnetic topology shift in AR2894. Monitoring for reconnection.' },
  { type: 'Background nominal', time: '16:48:55', sev: 'info', msg: 'Flux returned to baseline after minor C-class event.' },
  { type: 'Detector recalibrated', time: '16:21:40', sev: 'success', msg: 'CZT-1 gain correction applied after temp drift.' },
]

// quick severity → color/icon mapping, didn't want to deal with a design system for this
const sevColor = { error: '#ef4444', warning: '#eab308', info: '#3b82f6', success: '#22c55e' }
const sevIcon = { error: '!', warning: '!', info: 'i', success: '✓' }

const activeRegions = [
  { name: 'AR2890', cls: 'Delta', prob: 64, confidence: 'high', status: 'watching' },
  { name: 'AR2894', cls: 'Alpha', prob: 12, confidence: 'low', status: 'stable' },
  { name: 'AR2897', cls: 'Beta-Gamma', prob: 38, confidence: 'medium', status: 'watching' },
]

const FONT = "Inter, 'Segoe UI', Roboto, sans-serif"
const MONO = "'Roboto Mono', 'Consolas', monospace"

// realistic engineering-dashboard palette — swapped out the neon version, way too
// "demo day" looking and kind of hard to read for long stretches anyway
const bg = '#15161b'
const cardBg = '#1d1f26'
const cardBg2 = '#22242c'
const border = '#2c2e38'

const textPrimary = '#e7e8ec'
const textMuted = '#9a9cab'
const textFaint = '#6b6d7c'

const accent = '#3b82f6'
const warning = '#eab308'
const danger = '#ef4444'
const success = '#22c55e'

// temporary styling, will probably revisit spacing once we get real data and know
// which numbers actually need the most visual weight
const s = {
  page: { padding: '24px 28px 60px', display: 'flex', flexDirection: 'column', gap: 22, fontFamily: FONT, background: bg, color: textPrimary, minHeight: '100vh' },

  // single nav bar — used to have a second duplicate row here, removed it
  navBar: { display: 'flex', alignItems: 'center', gap: 20, paddingBottom: 14, borderBottom: `1px solid ${border}`, marginBottom: 4 },
  navItem: (active) => ({
    fontSize: 13.5, color: active ? textPrimary : textMuted, cursor: 'pointer',
    padding: '6px 1px', position: 'relative', transition: 'color 0.15s ease',
    fontWeight: active ? 600 : 400,
  }),
  navUnderline: { position: 'absolute', left: 0, right: -2, bottom: -15, height: 2, background: accent, borderRadius: 1, transition: 'all 0.2s ease' },
  themeToggle: {
    marginLeft: 'auto', fontSize: 12, color: textMuted, border: `1px solid ${border}`,
    borderRadius: 6, padding: '5px 11px', cursor: 'pointer', background: cardBg,
    transition: 'border-color 0.15s ease, color 0.15s ease',
  },

  // not a clean 3-col grid on purpose — middle card carries more info so it gets more room
  topCards: { display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' },
  card: {
    background: cardBg, border: `1px solid ${border}`,
    borderRadius: 8, padding: '16px 18px 18px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    transition: 'border-color 0.15s ease',
    flex: '1 1 280px',
  },
  cardTall: {
    background: cardBg, border: `1px solid ${border}`,
    borderRadius: 8, padding: '18px 19px 22px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    flex: '1.15 1 300px',
    marginTop: 6, // small offset so the row doesn't line up perfectly, looks less machine-made
  },
  cardLabel: { fontSize: 12.5, color: textMuted, marginBottom: 2, fontWeight: 500 },
  cardDesc: { fontSize: 11, color: textFaint, marginBottom: 11, lineHeight: 1.4 },
  badge: (color) => ({
    display: 'inline-block', padding: '2px 9px', borderRadius: 4,
    background: `${color}1a`, border: `1px solid ${color}44`,
    fontSize: 11, color, fontWeight: 500,
  }),
  bigValue: { fontFamily: MONO, fontSize: 27, fontWeight: 700, color: textPrimary, lineHeight: 1.15, marginTop: 8 },
  bigUnit: { fontSize: 11, color: textMuted, marginLeft: 4, fontFamily: FONT },
  bigValueGold: { fontFamily: MONO, fontSize: 27, fontWeight: 700, color: warning, lineHeight: 1.15, marginTop: 8 },
  subLabel: { fontSize: 10.5, color: textFaint, marginTop: 6 },
  progressBar: { height: 4, background: '#2a2c34', borderRadius: 2, marginTop: 10 },
  progressFill: (pct, color) => ({ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.3s ease' }),
  countdown: { fontFamily: MONO, fontSize: 29, fontWeight: 700, color: textPrimary, letterSpacing: '0.01em', marginTop: 8 },

  row: { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 310px', gap: 16, alignItems: 'start' },
  chartCard: { background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: '20px 22px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' },
  chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, flexWrap: 'wrap', gap: 8 },
  chartTitle: { fontSize: 14, color: textPrimary, fontWeight: 600 },
  chartSub: { fontSize: 11, color: textFaint, marginTop: 3 },
  timeButtons: { display: 'flex', gap: 4 },
  timeBtn: (active) => ({
    padding: '4px 11px', background: active ? accent : 'transparent',
    border: `1px solid ${active ? accent : border}`,
    borderRadius: 5, cursor: 'pointer', fontSize: 11,
    color: active ? '#fff' : textMuted, transition: 'all 0.15s ease',
  }),
  liveNote: { fontSize: 10.5, color: textFaint, marginTop: 8, fontStyle: 'italic' },

  alertCard: { background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: '17px 17px 8px', display: 'flex', flexDirection: 'column', maxHeight: 470 },
  alertHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  alertTitle: { fontSize: 13, fontWeight: 600, color: textPrimary },
  alertHint: { fontSize: 10.5, color: textFaint, marginBottom: 11 },
  alertList: { overflowY: 'auto', flex: 1, paddingRight: 2 },
  alertItem: { display: 'flex', gap: 10, padding: '10px 0', borderBottom: `1px solid ${border}` },
  alertDot: (color) => ({
    flexShrink: 0, width: 21, height: 21, borderRadius: '50%',
    background: `${color}1f`, border: `1.5px solid ${color}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, color, marginTop: 1, fontFamily: MONO, fontWeight: 700,
  }),
  alertType: (color) => ({ fontSize: 11.5, color, fontWeight: 600 }),
  alertTime: { fontSize: 10, color: textFaint, marginLeft: 7, fontFamily: MONO },
  alertMsg: { fontSize: 11, color: textMuted, marginTop: 3, lineHeight: 1.45 },
  viewLogs: { borderTop: `1px solid ${border}`, padding: '10px 0', textAlign: 'center', fontSize: 11, color: textMuted, cursor: 'pointer' },

  bottomRow: { display: 'flex', gap: 16, marginTop: 4, flexWrap: 'wrap' },
  leadCard: { background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: '18px 20px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', flex: '1.2 1 340px' },
  leadGrid: { display: 'flex', gap: 22, marginTop: 15, flexWrap: 'wrap' },
  leadLabel: { fontSize: 10.5, color: textFaint },
  leadValue: { fontFamily: MONO, fontSize: 19, color: textPrimary, marginTop: 5, fontWeight: 700 },
  leadValueGold: { fontFamily: MONO, fontSize: 19, color: warning, marginTop: 5, fontWeight: 700 },
  leadSub: { fontSize: 10, color: textFaint, marginTop: 4 },

  regionCard: { background: cardBg, border: `1px solid ${border}`, borderRadius: 8, padding: '17px 19px 15px', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', flex: '1 1 300px' },
  regionHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  regionHeader: { fontSize: 13, fontWeight: 600, color: textPrimary },
  regionCountNote: { fontSize: 10.5, color: textFaint },
  regionCardItem: { border: `1px solid ${border}`, borderRadius: 7, padding: '10px 13px', marginBottom: 9, background: cardBg2, transition: 'border-color 0.15s ease' },
  regionTopLine: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  regionName: { fontFamily: MONO, fontSize: 12, color: textPrimary, fontWeight: 600 },
  regionClass: { fontSize: 10.5, color: textFaint },
  regionStatLine: { display: 'flex', gap: 17, marginTop: 7, flexWrap: 'wrap' },
  regionStat: { fontSize: 10.5, color: textMuted },
  regionStatVal: (color) => ({ fontFamily: MONO, color, fontWeight: 700 }),
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{ background: cardBg2, border: `1px solid ${border}`, borderRadius: 6, padding: '9px 12px', fontSize: 11, boxShadow: '0 4px 10px rgba(0,0,0,0.35)' }}>
      <div style={{ color: textMuted, marginBottom: 5, fontFamily: MONO }}>{label} UTC</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontFamily: MONO, marginTop: 2 }}>
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [activeTime, setActiveTime] = useState('6H')
  const [seconds, setSeconds] = useState(1452) // 24:12, just a placeholder starting point
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [theme, setTheme] = useState('dark') // not fully wired up yet, just toggles the label for now
  const fluxData = generateFluxData()

  useEffect(() => {
    // BACKEND: replace with real countdown from /api/nowcast/lead-time
    const timer = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(timer)
  }, [])

  const hh = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const mm = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const ss = String(seconds % 60).padStart(2, '0')

  return (
    <div style={s.page}>
      {/* Nav — just one row now, was accidentally rendering a second nav above this
          when embedded in the parent shell, so keeping this one self-contained */}
      

      {/* Top stat cards — widths intentionally uneven, middle one needs more breathing room */}
      <div style={s.topCards}>
        <div style={s.card} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3a3c46'} onMouseLeave={(e) => e.currentTarget.style.borderColor = border}>
          <div style={s.cardLabel}>Current solar state</div>
          <div style={s.cardDesc}>based on rolling 10-min average</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* BACKEND: badge from /api/nowcast/current-state → solarState */}
            <span style={s.badge(textMuted)}>Quiescent</span>
          </div>
          {/* BACKEND: flux value from /api/nowcast/current-state → fluxValue */}
          <div style={s.bigValue}>X-1.2 <span style={s.bigUnit}>mag/flux</span></div>
        </div>

        <div style={s.cardTall} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3a3c46'} onMouseLeave={(e) => e.currentTarget.style.borderColor = border}>
          <div style={s.cardLabel}>Probability of X-class event</div>
          <div style={s.cardDesc}>model v0.9 — not yet calibrated, treat as a rough signal</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* BACKEND: risk level from /api/nowcast/x-class-probability */}
            <span style={s.badge(warning)}>Moderate risk</span>
          </div>
          {/* BACKEND: probability % from /api/nowcast/x-class-probability */}
          <div style={s.bigValueGold}>42.8%</div>
          <div style={s.subLabel}>cumulative, 24h window</div>
          <div style={s.progressBar}><div style={s.progressFill(42.8, warning)} /></div>
        </div>

        <div style={s.card} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3a3c46'} onMouseLeave={(e) => e.currentTarget.style.borderColor = border}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div style={s.cardLabel}>Lead time forecast</div>
            <span style={{ fontSize: 10.5, color: textFaint }}>T-minus</span>
          </div>
          <div style={s.cardDesc}>estimated time to peak intensity</div>
          {/* BACKEND: live countdown driven by /api/nowcast/lead-time → estimatedPeakSeconds */}
          <div style={s.countdown}>{hh}:{mm}:{ss}</div>
          <div style={s.subLabel}>est. peak, refreshes automatically</div>
        </div>
      </div>

      {/* Chart + alert feed */}
      <div style={s.row}>
        <div style={s.chartCard}>
          <div style={s.chartHeader}>
            <div>
              <div style={s.chartTitle}>Solar flux — SoLEXS / HEL1OS</div>
              <div style={s.chartSub}>soft and hard X-ray channels, overlaid</div>
            </div>
            <div style={s.timeButtons}>
              {['1H', '6H', '24H'].map(t => (
                <button key={t} style={s.timeBtn(activeTime === t)} onClick={() => setActiveTime(t)}>{t}</button>
              ))}
            </div>
          </div>
          {/* BACKEND: chart data from WS /ws/flux-stream or GET /api/nowcast/flux-history?window=6H */}
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={fluxData} margin={{ top: 16, right: 16, bottom: 0, left: -14 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#23252c" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: textFaint, fontSize: 10, fontFamily: 'Inter' }} tickLine={false} axisLine={{ stroke: border }} />
              <YAxis tick={{ fill: textFaint, fontSize: 10, fontFamily: 'Inter' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x="14:30" stroke="#eab30855" strokeDasharray="3 3" label={{ value: 'nowcasted: event A1', fill: textFaint, fontSize: 9 }} />
              <ReferenceLine x="16:00" stroke="#ef444455" strokeDasharray="3 3" label={{ value: 'predicted: X-flare', fill: danger, fontSize: 9 }} />
              <Line type="monotone" dataKey="solexs" name="SoLEXS" stroke={accent} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="helios" name="HEL1OS" stroke="#a855f7" strokeWidth={2} dot={false} />
              <Legend verticalAlign="bottom" height={30} wrapperStyle={{ fontSize: 11, color: textMuted, paddingTop: 10 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={s.liveNote}>updated every 5 sec · last sync 17:42:06 UTC</div>
        </div>

        <div style={s.alertCard}>
          <div style={s.alertHeader}>
            {/* BACKEND: live feed from WS /ws/alerts */}
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: danger, animation: 'pulse 1.5s infinite' }} />
            <span style={s.alertTitle}>Live alert feed</span>
          </div>
          <div style={s.alertHint}>scroll for older entries</div>
          <div style={s.alertList}>
            {mockAlerts.map((a, i) => {
              const color = sevColor[a.sev]
              return (
                <div key={i} style={s.alertItem}>
                  <div style={s.alertDot(color)}>{sevIcon[a.sev]}</div>
                  <div>
                    <span style={s.alertType(color)}>{a.type}</span>
                    <span style={s.alertTime}>{a.time}</span>
                    <div style={s.alertMsg}>{a.msg}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={s.viewLogs}>view system logs</div>
        </div>
      </div>

      {/* Lead-time analysis + active regions */}
      <div style={s.bottomRow}>
        <div style={s.leadCard}>
          <div style={s.cardLabel}>Lead-time analysis</div>
          {/* wasn't sure if this metric helps, keeping it for now since the model team asked for it */}
          <div style={s.cardDesc}>derived from the last 3 comparable events — small sample, take with a grain of salt</div>
          {/* BACKEND: all values from /api/nowcast/lead-time-analysis */}
          <div style={s.leadGrid}>
            <div>
              <div style={s.leadLabel}>Predicted onset</div>
              <div style={s.leadValue}>18:15 UTC</div>
              <div style={s.leadSub}>± 2.5 min deviation</div>
            </div>
            <div>
              <div style={s.leadLabel}>Peak intensity</div>
              <div style={s.leadValueGold}>X-1.8 est.</div>
              <div style={s.leadSub}>high confidence model</div>
            </div>
            <div>
              <div style={s.leadLabel}>Duration</div>
              <div style={s.leadValue}>~14 min</div>
              <div style={s.leadSub}>rapid decay profile</div>
            </div>
          </div>
        </div>

        <div style={s.regionCard}>
          {/* BACKEND: region list from /api/nowcast/active-regions */}
          <div style={s.regionHeaderRow}>
            <div style={s.regionHeader}>Active regions</div>
            <div style={s.regionCountNote}>{activeRegions.length} tracked</div>
          </div>
          {activeRegions.map((r, i) => (
            <div
              key={i}
              style={s.regionCardItem}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3a3c46'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = border}
            >
              <div style={s.regionTopLine}>
                <span style={s.regionName}>{r.name}</span>
                <span style={s.regionClass}>{r.cls}</span>
              </div>
              <div style={s.regionStatLine}>
                <span style={s.regionStat}>flare prob: <span style={s.regionStatVal(r.prob > 50 ? danger : r.prob > 25 ? warning : success)}>{r.prob}%</span></span>
                <span style={s.regionStat}>conf: <span style={{ fontFamily: MONO, color: textMuted }}>{r.confidence}</span></span>
                <span style={s.regionStat}>{r.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}