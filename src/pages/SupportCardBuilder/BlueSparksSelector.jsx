const STATS = ['Speed', 'Stamina', 'Power', 'Guts', 'Wit']
const STAR_LABELS = { 1: '★', 2: '★★', 3: '★★★' }

// Six blue-spark slots (stat + star rank each). Only the cap-raise half of
// each spark actually affects scoring (via engineBridge.getSparkCapBonus) -
// same as the original, which computes a flat-stat bonus too but never
// wires it into the scoring engine either, only into its own summary.
export default function BlueSparksSelector({ sparks, sparkBonuses, maxSparks, onChange }) {
  function updateSlot(index, patch) {
    onChange(sparks.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  const activeCount = sparks.filter((s) => s.stat && s.star).length

  return (
    <div className="card" style={{ padding: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)' }}>
          Blue sparks ({activeCount}/{maxSparks})
        </label>
      </div>

      <div className="scb-sparks-grid">
        {sparks.map((slot, index) => (
          <div key={index} className="scb-spark-slot">
            <span className="field-hint">Slot {index + 1}</span>
            <select
              value={slot.stat ?? ''}
              onChange={(e) => updateSlot(index, { stat: e.target.value || null })}
            >
              <option value="">—</option>
              {STATS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={slot.star ?? ''}
              onChange={(e) => updateSlot(index, { star: e.target.value ? parseInt(e.target.value, 10) : null })}
            >
              <option value="">—</option>
              {[1, 2, 3].map((star) => (
                <option key={star} value={star}>{STAR_LABELS[star]}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {Object.keys(sparkBonuses || {}).length > 0 && (
        <div className="scb-sparks-summary">
          <span className="field-hint">Cap raise:</span>
          {Object.entries(sparkBonuses).map(([stat, bonus]) => (
            <span key={stat} className="pill">{stat === 'Intelligence' ? 'Wit' : stat} +{bonus}</span>
          ))}
        </div>
      )}
    </div>
  )
}
