import { useState } from 'react'

// ─────────────────────────────────────────────────────────────
// ARCHIVE PAGE
// added after the main dashboard was working — needed somewhere
// to dump old detections instead of just losing them on refresh
// TODO: replace dummy archive API endpoint
// ─────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#15161b',
  card: '#1d1f26',
  border: '#2d2f38',
  accent: '#3b82f6',
  warn: '#eab308',
  error: '#ef4444',
  success: '#22c55e',
  text: '#e5e7eb',
  textDim: '#9ca3af',
  textFaint: '#6b7280',
}

const FONT = "'Inter', 'Segoe UI', Roboto, sans-serif"
const MONO = "'JetBrains Mono', 'Courier New', monospace"

// BACKEND: GET /api/archive/events — paginated, sorted desc by timestamp
const events = [
  {
    id: 1, ts: '17 Jun 2025', time: '14:12 UTC', cls: 'X', label: 'X1.7 flare detected',
    region: 'AR2890', confidence: 91, peak: '1.7e-4 W/m²', source: 'HEL1OS', status: 'archived',
    notes: 'rapid intensity rise observed\npossible magnetic reconnection signature',
  },
  {
    id: 2, ts: '16 Jun 2025', time: '03:48 UTC', cls: 'M', label: 'M4.2 flare detected',
    region: 'AR2888', confidence: 76, peak: '4.2e-5 W/m²', source: 'SoLEXS', status: 'archived',
    notes: 'gradual decay, consistent with prior cycle',
  },
  {
    id: 3, ts: '14 Jun 2025', time: '21:05 UTC', cls: 'info', label: 'Region AR2890 rotated into view',
    region: 'AR2890', confidence: 100, peak: '—', source: 'GND_BLR', status: 'logged',
    notes: 'baseline tracking initiated, no flare activity yet',
  },
  {
    id: 4, ts: '12 Jun 2025', time: '09:31 UTC', cls: 'M', label: 'M1.0 flare detected',
    region: 'AR2885', confidence: 68, peak: '1.0e-5 W/m²', source: 'HEL1OS', status: 'archived',
    notes: 'low confidence — overlapping signal with background noise',
  },
  {
    id: 5, ts: '09 Jun 2025', time: '17:55 UTC', cls: 'X', label: 'X2.1 flare detected',
    region: 'AR2881', confidence: 88, peak: '2.1e-4 W/m²', source: 'SoLEXS', status: 'archived',
    notes: 'second largest event recorded this cycle',
  },
  {
    id: 6, ts: '05 Jun 2025', time: '06:14 UTC', cls: 'M', label: 'M6.6 flare detected',
    region: 'AR2879', confidence: 81, peak: '6.6e-5 W/m²', source: 'HEL1OS', status: 'archived',
    notes: '',
  },
]

const classColor = (cls) =>
  cls === 'X' ? COLORS.error : cls === 'M' ? COLORS.warn : COLORS.accent

function classDot(cls) {
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
      background: classColor(cls), marginRight: 8, flexShrink: 0,
    }} />
  )
}

export default function Archive() {
  const [selected, setSelected] = useState(events[0])
  const [classFilter, setClassFilter] = useState('all')
  const [hoveredId, setHoveredId] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const filtered = classFilter === 'all' ? events : events.filter(e => e.cls === classFilter)

  // temporary grouping logic — group by day, revisit when real pagination exists
  const grouped = filtered.reduce((acc, e) => {
    (acc[e.ts] = acc[e.ts] || []).push(e)
    return acc
  }, {})

  function handleLoadMore() {
    setLoadingMore(true)
    // wasn't sure if this should be a real fetch or just a delay for now
    setTimeout(() => setLoadingMore(false), 1200)
  }

  return (
    <div style={{
      background: COLORS.bg, minHeight: '100vh', fontFamily: FONT,
      color: COLORS.text, padding: '28px 24px 60px',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        .ev-card { transition: border-color 0.15s ease, transform 0.1s ease; cursor: pointer; }
        .ev-card:hover { border-color: ${COLORS.accent} !important; }
        .filter-input { transition: border-color 0.15s ease; }
        .filter-input:focus { outline: none; border-color: ${COLORS.accent}; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: ${COLORS.bg}; }
        ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 4px; }
      `}</style>

      {/* header — kept loose, didn't want a centered hero like the dashboard has */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, color: COLORS.textFaint, fontFamily: MONO, marginBottom: 4 }}>
          solar-flare-forecasting / archive
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>Event archive</h1>
        <div style={{ fontSize: 13, color: COLORS.textDim, marginTop: 4, maxWidth: 560 }}>
          Historical record of detected flare events, pulled in from the live dashboard once they age out of the active feed.
        </div>
      </div>

      {/* ── overview cards, intentionally uneven widths ── */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap',
      }}>
        <OverviewCard width={180} label="Archived events" sub="total in database" value="1,248" />
        <OverviewCard width={150} label="First event" sub="earliest record" value="2024-08-12" mono />
        <OverviewCard width={150} label="Latest update" sub="last sync" value="2025-07-11" mono />
        <OverviewCard width={130} label="Storage" sub="db size" value="2.4 GB" />
        <OverviewCard width={150} label="Retention" sub="policy" value="5 years" />
      </div>

      {/* ── main layout: filters | timeline | details ── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* FILTER PANEL */}
        <div style={{
          width: 220, flexShrink: 0, background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderRadius: 8, padding: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>Filters</div>
          <div style={{ fontSize: 10, color: COLORS.textFaint, fontFamily: MONO, marginBottom: 14 }}>
            {/* added filtering once the archive became too large to browse manually */}
          </div>

          <FieldLabel>Date range</FieldLabel>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            <input className="filter-input" type="date" defaultValue="2024-08-12"
              style={inputStyle(true)} />
            <input className="filter-input" type="date" defaultValue="2025-07-11"
              style={inputStyle(true)} />
          </div>

          <FieldLabel>Flare class</FieldLabel>
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            {[
              { v: 'all', label: 'All' },
              { v: 'X', label: 'X-class' },
              { v: 'M', label: 'M-class' },
              { v: 'info', label: 'Info' },
            ].map(opt => (
              <button key={opt.v} onClick={() => setClassFilter(opt.v)} style={{
                fontSize: 11, padding: '5px 10px', borderRadius: 5, cursor: 'pointer',
                fontFamily: FONT,
                background: classFilter === opt.v ? COLORS.accent : 'transparent',
                border: `1px solid ${classFilter === opt.v ? COLORS.accent : COLORS.border}`,
                color: classFilter === opt.v ? '#fff' : COLORS.textDim,
              }}>{opt.label}</button>
            ))}
          </div>

          <FieldLabel>Region</FieldLabel>
          <select className="filter-input" style={inputStyle()} defaultValue="">
            <option value="">All regions</option>
            <option>AR2890</option>
            <option>AR2888</option>
            <option>AR2885</option>
            <option>AR2881</option>
            <option>AR2879</option>
          </select>

          <div style={{ height: 14 }} />
          <FieldLabel>Confidence threshold</FieldLabel>
          <input type="range" min="0" max="100" defaultValue="60" style={{ width: '100%', accentColor: COLORS.accent }} />
          <div style={{ fontSize: 10, fontFamily: MONO, color: COLORS.textFaint, marginTop: -2 }}>min 60%</div>

          <div style={{ height: 14 }} />
          <FieldLabel>Mission source</FieldLabel>
          <select className="filter-input" style={inputStyle()} defaultValue="">
            <option value="">All sources</option>
            <option>HEL1OS</option>
            <option>SoLEXS</option>
            <option>GND_BLR</option>
          </select>
        </div>

        {/* TIMELINE */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            maxHeight: 640, overflowY: 'auto', paddingRight: 4,
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {Object.entries(grouped).map(([day, items]) => (
              <div key={day}>
                <div style={{
                  fontSize: 11, fontFamily: MONO, color: COLORS.textFaint,
                  margin: '10px 0 6px 2px',
                }}>{day}</div>
                {items.map(e => (
                  <div key={e.id} className="ev-card"
                    onClick={() => setSelected(e)}
                    onMouseEnter={() => setHoveredId(e.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    style={{
                      background: COLORS.card,
                      border: `1px solid ${selected.id === e.id ? COLORS.accent : COLORS.border}`,
                      borderRadius: 8,
                      padding: e.notes ? '14px 16px' : '11px 16px',
                      marginBottom: 8,
                      display: 'flex', justifyContent: 'space-between', gap: 12,
                    }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        {classDot(e.cls)}
                        <span style={{ fontSize: 14, fontWeight: 500 }}>{e.label}</span>
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.textDim, marginBottom: e.notes ? 8 : 0 }}>
                        Region {e.region} · <span style={{ fontFamily: MONO }}>{e.time}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 11, fontFamily: MONO, color: COLORS.textFaint, flexWrap: 'wrap' }}>
                        <span>confidence: {e.confidence}%</span>
                        <span>peak intensity: {e.peak}</span>
                        <span>source: {e.source}</span>
                        <span style={{
                          color: e.status === 'archived' ? COLORS.success : COLORS.accent,
                        }}>status: {e.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <div style={{
              textAlign: 'center', padding: '14px 0', fontSize: 12, color: COLORS.textFaint,
              fontFamily: MONO, cursor: 'pointer',
            }} onClick={handleLoadMore}>
              {loadingMore ? 'loading older records...' : '↓ load older records'}
            </div>
          </div>
        </div>

        {/* DETAIL PANEL */}
        <div style={{
          width: 240, flexShrink: 0, background: COLORS.card, border: `1px solid ${COLORS.border}`,
          borderRadius: 8, padding: 16, position: 'sticky', top: 16,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Selected event</div>

          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            {classDot(selected.cls)}
            <span style={{ fontSize: 13 }}>{selected.label}</span>
          </div>

          <DetailRow label="Timestamp" value={`${selected.ts} · ${selected.time}`} mono />
          <DetailRow label="Detector source" value={selected.source} />
          <DetailRow label="Prediction accuracy" value={`${selected.confidence}%`} mono />
          <DetailRow label="Active region" value={selected.region} mono />
          <DetailRow label="Archive status" value={selected.status} />

          <div style={{ height: 10 }} />
          <FieldLabel>Operator notes</FieldLabel>
          <div style={{
            fontSize: 12, color: COLORS.textDim, lineHeight: 1.5, whiteSpace: 'pre-line',
            background: 'rgba(255,255,255,0.02)', border: `1px solid ${COLORS.border}`,
            borderRadius: 6, padding: '8px 10px', minHeight: 40,
          }}>
            {selected.notes || '— no notes recorded —'}
          </div>
        </div>
      </div>
    </div>
  )
}

function OverviewCard({ width, label, sub, value, mono }) {
  return (
    <div style={{
      width, background: COLORS.card, border: `1px solid ${COLORS.border}`,
      borderRadius: 8, padding: '14px 16px',
    }}>
      <div style={{ fontSize: 12, color: COLORS.textDim }}>{label}</div>
      <div style={{ fontSize: 10, color: COLORS.textFaint, marginBottom: 6 }}>{sub}</div>
      <div style={{ fontSize: 18, fontWeight: 600, fontFamily: mono ? MONO : FONT }}>{value}</div>
    </div>
  )
}

function FieldLabel({ children }) {
  return <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 6 }}>{children}</div>
}

function DetailRow({ label, value, mono }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: COLORS.textFaint }}>{label}</div>
      <div style={{ fontSize: 13, fontFamily: mono ? MONO : FONT }}>{value}</div>
    </div>
  )
}

function inputStyle(half) {
  return {
    width: half ? '50%' : '100%', background: COLORS.bg, border: `1px solid ${COLORS.border}`,
    borderRadius: 5, padding: '6px 8px', fontSize: 11, color: COLORS.text, fontFamily: FONT,
  }
}