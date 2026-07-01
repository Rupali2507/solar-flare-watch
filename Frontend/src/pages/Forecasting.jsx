import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Download, Sun, Zap, AlertTriangle, Moon } from 'lucide-react'
import { useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND CONNECTION POINTS:
// 1. GET /api/forecast/model-meta           → modelConfidence, latencyMs, epochs, datasetSize
// 2. WS  /ws/predicted-events              → predictedEventsStream (live inference)
// 3. GET /api/forecast/events              → flare/CME event list with probability, class, leadTime, status
// 4. GET /api/forecast/performance-metrics → truePositiveRate, falseAlarmRate
// 5. WS  /ws/light-curve                   → liveStream + modelExpectation chart data
// 6. GET /api/forecast/correlation-matrix  → SOLEXS/HEL1OS co-relation heatmap data (now: active regions list)
// 7. GET /api/forecast/energy-spike        → energy spike distribution data
// ─────────────────────────────────────────────────────────────────────────────

// wasn't sure if this metric helps, keeping it for now
const lcData = Array.from({ length: 30 }, (_, i) => ({
  t: `${String(9 + Math.floor(i / 6)).padStart(2, '0')}:${String((i % 6) * 10).padStart(2, '0')}`,
  live: 0.3 + i * 0.025 + Math.sin(i * 0.5) * 0.05,
  model: 0.27 + i * 0.022 + Math.sin(i * 0.4) * 0.03,
}))

const events = [
  // BACKEND: from WS /ws/predicted-events or GET /api/forecast/events
  { id: 'FLARE-992', prob: 88, class: 'X2.4', xClass: true, leadTime: '12m', status: 'Imminent', statusColor: '#ef4444', updated: '5 sec ago' },
  { id: 'FLARE-993', prob: 62, class: 'M5.1', xClass: false, leadTime: '42m', status: 'Monitoring', statusColor: '#facc15', updated: '38 sec ago' },
  { id: 'CME-812', prob: 31, class: 'C9.8', xClass: false, leadTime: '112m', status: 'Stable', statusColor: '#8b93a7', updated: '1 min ago' },
  { id: 'FLARE-994', prob: 45, class: 'M1.2', xClass: false, leadTime: '204m', status: 'Stable', statusColor: '#8b93a7', updated: '2 min ago' },
]

const regions = [
  // BACKEND: from /api/forecast/active-regions (replaces old correlation heatmap)
  { name: 'AR3498', prob: 82, conf: 91, status: 'Monitoring', updated: '5 sec ago', statusColor: '#facc15' },
  { name: 'AR3501', prob: 22, conf: 73, status: 'Stable', updated: '40 sec ago', statusColor: '#8b93a7' },
  { name: 'AR3505', prob: 9, conf: 65, status: 'Stable', updated: '2 min ago', statusColor: '#8b93a7' },
]

const alerts = [
  // BACKEND: from /api/forecast/alerts, ordered newest first
  { time: '10:42 AM', icon: '⚠', color: '#facc15', title: 'Elevated x-ray flux detected', desc: 'Monitoring flare region AR3498', action: 'No action required — continue monitoring' },
  { time: '10:56 AM', icon: '🔴', color: '#ef4444', title: 'X-class event probability exceeded threshold', desc: 'Switching system to high sensitivity mode', action: 'Review FLARE-992, confirm with duty operator' },
  { time: '11:08 AM', icon: '⚠', color: '#facc15', title: 'Minor deviation from model baseline', desc: 'Live curve drifted 2.1% above expected', action: 'Log deviation, recheck in 10 min' },
]

const spikeData = [0.3, 0.5, 0.7, 0.9, 0.6, 0.4, 0.8, 0.5, 0.3, 0.6]

export default function Forecasting() {
  const [dark, setDark] = useState(true)

  return (
    <div style={styles.page}>
      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <Nav dark={dark} setDark={setDark} />

      <div style={styles.header}>
        <div>
          {/* BACKEND: mission day / precursor id from /api/forecast/model-meta */}
          <div style={styles.title}>Predictive analysis</div>
          <div style={styles.subtitle}>Solar cycle 25 · Mission day 1,482 · Precursor ID 4492-X</div>
        </div>
        <div style={styles.metaCards}>
          <div style={styles.metaCard}>
            <div style={styles.metaLabel}>Model confidence</div>
            <div style={styles.metaValue}>94.2%</div>
          </div>
          <div style={{ ...styles.metaCard, marginTop: 6 }}>
            <div style={styles.metaLabel}>Latency</div>
            <div style={styles.metaValue}>120ms</div>
          </div>
        </div>
      </div>

      {/* ── MAIN: event stream (wide) + metrics panel (narrow side utility) ── */}
      <div style={styles.mainGrid}>
        <div style={{ ...styles.card, padding: '18px 22px' }}>
          <div style={styles.cardHeaderRow}>
            <div style={styles.cardTitle}>Predicted events stream</div>
            <div style={styles.cardSubtitle}>real-time inference</div>
          </div>
          {/* BACKEND: rows from WS /ws/predicted-events (real-time) or GET /api/forecast/events */}
          <div style={styles.tableHeader}>
            <span style={styles.th}>Event</span>
            <span style={styles.th}>Probability</span>
            <span style={styles.th}>Class</span>
            <span style={styles.th}>Lead time</span>
            <span style={styles.th}>Status</span>
          </div>
          {events.map((e, i) => (
            <EventRow key={e.id} e={e} i={i} />
          ))}
        </div>

        {/* perf metrics — feels like a side utility panel */}
        <div style={styles.perfCard}>
          <div style={styles.cardTitle}>Model metrics</div>

          <Metric label="Detection accuracy" value="98.4%" color="#22c55e" pct={98.4}
            desc="Based on validation runs from historical flare data" />
          <Metric label="False alarm rate" value="1.2%" color="#ef4444" pct={1.2}
            desc="Out of all triggered alerts in the last 30 days" />

          {/* TODO: replace dummy prediction API */}
          <div style={styles.smallStatRow}>
            <SmallStat label="Inference latency" value="120ms" note="avg. response, latest build" />
            <SmallStat label="Dataset size" value="184TB" note="across SOLEXS + HEL1OS" />
          </div>
          <div style={styles.smallStatRow}>
            <SmallStat label="Training epochs" value="1,200" note="rough estimate, may be stale" />
            <SmallStat label="Model confidence" value="94.2%" note="// TODO: use backend score" />
          </div>
        </div>
      </div>

      {/* ── LIGHT CURVE — now the visual focus of the page ───────────────── */}
      <div style={{ ...styles.card, padding: '22px 24px', marginTop: 26 }}>
        <div style={styles.cardHeaderRow}>
          <div>
            <div style={styles.cardTitle}>Light curve comparison</div>
            <div style={styles.cardSubtitle}>updated every 5 sec</div>
          </div>
          {/* BACKEND: dropdown filters linked to /api/forecast/flux-band */}
          <select style={styles.select}>
            <option>X-ray flux (0.1–0.8 nm)</option>
          </select>
        </div>
        {/* BACKEND: chart data from WS /ws/light-curve → liveStream + modelExpectation */}
        {/* this graph looked too empty without prediction overlay, kept both lines */}
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={lcData} margin={{ top: 10, right: 16, bottom: 0, left: -10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="t" tick={{ fill: '#8b93a7', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'rgba(255,255,255,0.06)' }} interval={4} />
            <YAxis tick={{ fill: '#8b93a7', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ background: '#1d1f26', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: '#e5e7eb' }}
            />
            <Line type="monotone" dataKey="live" name="Live stream" stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="model" name="Model expectation" stroke="#facc15" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
        <div style={styles.legendRow}>
          <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#3b82f6' }} /> Live stream</span>
          <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#facc15' }} /> Model expectation</span>
        </div>
        <div style={styles.annotationBox}>
          Current deviation from model baseline: <strong style={{ color: '#facc15' }}>2.1%</strong>
        </div>
      </div>

      {/* ── ALERTS TIMELINE + ACTIVE REGIONS ─────────────────────────────── */}
      <div style={styles.bottomGrid}>
        <div style={{ ...styles.card, padding: '18px 20px' }}>
          <div style={styles.cardTitle}>Alerts timeline</div>
          <div style={styles.timelineScroll}>
            <div style={styles.timelineLine} />
            {alerts.map((a, i) => (
              <AlertCard key={i} a={a} i={i} />
            ))}
          </div>
        </div>

        {/* narrower, visually secondary — replaces old heatmap */}
        <div style={{ ...styles.card, padding: '16px 18px' }}>
          <div style={styles.cardTitle}>Active solar regions</div>
          {regions.map((r, i) => (
            <RegionCard key={r.name} r={r} i={i} />
          ))}

          <div style={{ ...styles.cardSubtitle, marginTop: 18, marginBottom: 6 }}>Energy spike distribution</div>
          {/* BACKEND: spike histogram from /api/forecast/energy-spike */}
          <div style={styles.spikeBars}>
            {spikeData.map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h * 100}%`, background: '#3b82f6', borderRadius: '2px 2px 0 0', opacity: 0.6 + h * 0.3 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function Nav({ dark, setDark }) {
  const tabs = ['Overview', 'Forecasting', 'Archive', 'Settings']
  const [active, setActive] = useState('Forecasting')
 
}

function EventRow({ e, i }) {
  return (
    <div style={{ ...styles.tableRow, padding: i % 2 === 0 ? '11px 10px' : '13px 10px' }}>
      <span style={styles.eventId}>
        <Zap size={12} style={{ marginRight: 6, color: e.xClass ? '#ef4444' : '#facc15', verticalAlign: '-2px' }} />
        {e.id}
        <div style={styles.eventMeta}>Updated {e.updated}</div>
      </span>
      <div style={styles.probCell}>
        <div style={styles.probTrack}>
          <div style={{ height: '100%', width: `${e.prob}%`, background: e.xClass ? '#ef4444' : '#3b82f6', borderRadius: 2 }} />
        </div>
        <span style={styles.probLabel}>{e.prob}%</span>
      </div>
      <span style={{ ...styles.classTag, color: e.xClass ? '#ef4444' : '#facc15' }}>{e.class}</span>
      <span style={styles.leadTime}>{e.leadTime}</span>
      <span style={{ ...styles.statusBadge, color: e.statusColor, borderColor: e.statusColor, background: `${e.statusColor}18` }}>
        {e.status}
      </span>
    </div>
  )
}

function Metric({ label, value, color, pct, desc }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={styles.perfRow}>
        <span style={styles.perfLabel}>{label}</span>
        <span style={{ ...styles.perfValue, color }}>{value}</span>
      </div>
      <div style={styles.perfBarTrack}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 2 }} />
      </div>
      <div style={styles.metricDesc}>{desc}</div>
    </div>
  )
}

function SmallStat({ label, value, note }) {
  return (
    <div style={styles.smallStat}>
      <div style={styles.smallStatLabel}>{label}</div>
      <div style={styles.smallStatValue}>{value}</div>
      <div style={styles.smallStatNote}>{note}</div>
    </div>
  )
}

function AlertCard({ a, i }) {
  return (
    <div style={{ ...styles.alertCard, marginBottom: i === 2 ? 0 : 14, paddingBottom: i % 2 === 0 ? 12 : 14 }}>
      <div style={{ ...styles.alertDot, background: a.color }} />
      <div style={styles.alertTime}>{a.time}</div>
      <div style={styles.alertBody}>
        <div style={styles.alertTitle}>{a.icon} {a.title}</div>
        <div style={styles.alertDesc}>{a.desc}</div>
        <div style={styles.alertAction}>→ {a.action}</div>
      </div>
    </div>
  )
}

function RegionCard({ r, i }) {
  return (
    <div style={{ ...styles.regionCard, marginBottom: i === 2 ? 0 : 10, padding: i === 0 ? '12px 14px' : '10px 14px' }}>
      <div style={styles.regionTop}>
        <span style={styles.regionName}>{r.name}</span>
        <span style={{ ...styles.regionStatus, color: r.statusColor }}>{r.status}</span>
      </div>
      <div style={styles.regionRow}>
        <span style={styles.regionLabel}>Flare probability</span>
        <span style={styles.regionValue}>{r.prob}%</span>
      </div>
      <div style={styles.regionRow}>
        <span style={styles.regionLabel}>Confidence</span>
        <span style={styles.regionValue}>{r.conf}%</span>
      </div>
      <div style={styles.regionUpdated}>Last update {r.updated}</div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles — kept inline since this is how the rest of the app does it.
// // mixed paddings/margins below on purpose, didn't go back and normalize everything
// ─────────────────────────────────────────────────────────────────────────────

const styles = {
  page: {
    background: '#15161b',
    color: '#e5e7eb',
    fontFamily: "Inter, 'Segoe UI', Roboto, sans-serif",
    padding: '24px 28px 40px',
    display: 'flex',
    flexDirection: 'column',
  },

  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    paddingBottom: 12,
    marginBottom: 22,
  },
  navTabs: { display: 'flex', gap: 22 },
  navTab: {
    fontSize: 13,
    paddingBottom: 10,
    cursor: 'pointer',
    transition: 'color 0.15s ease',
  },
  themeToggle: {
    width: 28, height: 28, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
    color: '#8b93a7', transition: 'background 0.15s ease',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 22,
    flexWrap: 'wrap',
    gap: 16,
  },
  title: { fontSize: 28, fontWeight: 600, color: '#e5e7eb', textAlign: 'left' },
  subtitle: { fontSize: 13, color: '#8b93a7', marginTop: 4, textAlign: 'left' },
  metaCards: { display: 'flex', flexDirection: 'column', gap: 0 },
  metaCard: {
    background: '#1d1f26', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8, padding: '10px 18px', minWidth: 150,
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  metaLabel: { fontSize: 12, color: '#8b93a7' },
  metaValue: { fontSize: 20, color: '#e5e7eb', fontWeight: 600, marginTop: 2, fontFamily: "'JetBrains Mono', monospace" },

  // main grid: event stream wide, metrics narrow side panel
  mainGrid: { display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' },

  card: {
    background: '#1d1f26',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
  },
  cardHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 },
  cardTitle: { fontSize: 18, fontWeight: 600, color: '#e5e7eb', textAlign: 'left' },
  cardSubtitle: { fontSize: 13, color: '#8b93a7', marginTop: 2 },

  select: {
    background: '#232631', border: '1px solid rgba(255,255,255,0.06)',
    color: '#8b93a7', fontSize: 12, padding: '5px 10px', borderRadius: 6,
  },

  tableHeader: { display: 'grid', gridTemplateColumns: '170px 130px 70px 90px 110px', gap: 8, padding: '4px 10px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  th: { fontSize: 12, color: '#8b93a7', textAlign: 'left' },
  tableRow: {
    display: 'grid', gridTemplateColumns: '170px 130px 70px 90px 110px',
    gap: 8, alignItems: 'center', borderRadius: 6,
    transition: 'background 0.15s ease',
  },
  eventId: { fontSize: 13, color: '#e5e7eb', fontFamily: "'JetBrains Mono', monospace" },
  eventMeta: { fontSize: 11, color: '#8b93a7', marginTop: 2, marginLeft: 18 },
  probCell: { display: 'flex', alignItems: 'center', gap: 8 },
  probTrack: { width: 60, height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 2 },
  probLabel: { fontSize: 12, color: '#e5e7eb', fontFamily: "'JetBrains Mono', monospace" },
  classTag: { fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" },
  leadTime: { fontSize: 13, color: '#8b93a7', fontFamily: "'JetBrains Mono', monospace" },
  statusBadge: {
    display: 'inline-block', padding: '3px 9px', borderRadius: 4,
    border: '1px solid', fontSize: 11, width: 'fit-content',
  },

  perfCard: {
    background: '#232631', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10, padding: '16px 18px',
    boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
  },
  perfRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, marginTop: 12 },
  perfLabel: { fontSize: 12, color: '#8b93a7' },
  perfValue: { fontSize: 14, fontFamily: "'JetBrains Mono', monospace" },
  perfBarTrack: { height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 },
  metricDesc: { fontSize: 11, color: '#8b93a7', marginTop: 5, lineHeight: 1.4 },

  smallStatRow: { display: 'flex', gap: 10, marginTop: 14 },
  smallStat: { flex: 1, background: '#1d1f26', borderRadius: 8, padding: '10px 12px' },
  smallStatLabel: { fontSize: 11, color: '#8b93a7' },
  smallStatValue: { fontSize: 16, color: '#e5e7eb', fontWeight: 600, marginTop: 3, fontFamily: "'JetBrains Mono', monospace" },
  smallStatNote: { fontSize: 10, color: '#8b93a7', marginTop: 4, fontStyle: 'italic' },

  legendRow: { display: 'flex', gap: 18, marginTop: 10, justifyContent: 'center' },
  legendItem: { fontSize: 12, color: '#8b93a7', display: 'flex', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: '50%', display: 'inline-block' },
  annotationBox: {
    marginTop: 14, fontSize: 12, color: '#8b93a7',
    borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10,
  },

  bottomGrid: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginTop: 24, alignItems: 'start' },

  timelineScroll: { maxHeight: 320, overflowY: 'auto', position: 'relative', paddingLeft: 14, marginTop: 4 },
  timelineLine: { position: 'absolute', left: 4, top: 4, bottom: 4, width: 1, background: 'rgba(255,255,255,0.08)' },
  alertCard: { position: 'relative', paddingLeft: 18 },
  alertDot: { position: 'absolute', left: -14, top: 4, width: 9, height: 9, borderRadius: '50%' },
  alertTime: { fontSize: 11, color: '#8b93a7', fontFamily: "'JetBrains Mono', monospace", marginBottom: 3 },
  alertBody: {},
  alertTitle: { fontSize: 14, color: '#e5e7eb', fontWeight: 500 },
  alertDesc: { fontSize: 12, color: '#8b93a7', marginTop: 3 },
  alertAction: { fontSize: 11, color: '#3b82f6', marginTop: 5 },

  regionCard: { background: '#1d1f26', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' },
  regionTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  regionName: { fontSize: 14, fontWeight: 600, color: '#e5e7eb', fontFamily: "'JetBrains Mono', monospace" },
  regionStatus: { fontSize: 11 },
  regionRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 2 },
  regionLabel: { fontSize: 12, color: '#8b93a7' },
  regionValue: { fontSize: 12, color: '#e5e7eb', fontFamily: "'JetBrains Mono', monospace" },
  regionUpdated: { fontSize: 10, color: '#8b93a7', marginTop: 4 },

  spikeBars: { display: 'flex', alignItems: 'flex-end', gap: 3, height: 44, marginTop: 4 },
}