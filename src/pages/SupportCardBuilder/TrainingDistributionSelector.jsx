const STATS = ['Speed', 'Stamina', 'Power', 'Guts', 'Wit']
const STAT_COLORS = {
  Speed: 'var(--pink)',
  Stamina: 'var(--green)',
  Power: 'var(--amber)',
  Guts: 'var(--red)',
  Wit: 'var(--blue)',
}

// Lets you override where training turns get spent, instead of the deck's
// own auto-calculated distribution (which comes from each card's Specialty
// Priority bonus). Ported from Tachyon's Lab's TrainingDistributionSelector
// - percentages auto-normalize to 100% as you type, they don't need to sum
// to exactly 100 themselves.
export default function TrainingDistributionSelector({ calculatedDistribution, manualDistribution, isManual, onToggleManual, onManualDistributionChange }) {
  const current = isManual && manualDistribution ? manualDistribution : calculatedDistribution

  function handleInputChange(index, rawValue) {
    const clamped = Math.max(0, Math.min(100, parseInt(rawValue, 10) || 0))
    const asPercents = current.map((v, i) => (i === index ? clamped : Math.round(v * 100)))
    const sum = asPercents.reduce((a, b) => a + b, 0)
    if (sum > 0) {
      onManualDistributionChange(asPercents.map((v) => v / sum))
    }
  }

  return (
    <div className="card" style={{ padding: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)' }}>Training distribution</label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', cursor: 'pointer' }}>
          <input type="checkbox" checked={isManual} onChange={(e) => onToggleManual(e.target.checked)} />
          Manual override
        </label>
      </div>

      {STATS.map((stat, i) => {
        const pct = current[i] * 100
        return (
          <div key={stat} className="scb-dist-row">
            <span className="scb-dist-label">{stat}</span>
            <div className="scb-dist-bar">
              <div className="scb-dist-bar-fill" style={{ width: `${pct}%`, background: STAT_COLORS[stat] }} />
            </div>
            {isManual ? (
              <input
                type="number"
                min="0"
                max="100"
                value={Math.round(pct)}
                onChange={(e) => handleInputChange(i, e.target.value)}
                className="scb-dist-input"
              />
            ) : (
              <span className="scb-dist-value">{pct.toFixed(1)}%</span>
            )}
          </div>
        )
      })}

      {isManual && (
        <div className="field-hint" style={{ textAlign: 'right', marginTop: 6 }}>
          Normalized automatically to 100%
        </div>
      )}
    </div>
  )
}
