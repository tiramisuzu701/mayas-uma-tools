import { SPARK_BONUSES } from './engineBridge.js'
import { statColor } from './statTheme.js'

const STATS = ['Speed', 'Stamina', 'Power', 'Guts', 'Wit']
const STAR_LABELS = { 1: '★', 2: '★★', 3: '★★★' }

function displayStat(stat) {
  return stat === 'Intelligence' ? 'Wit' : stat
}

// Six blue-spark slots (stat + star rank each). Both halves of a spark's
// bonus now feed the scoring engine: the cap-raise half (raises the 1200
// soft-stat-cap threshold) and the flat-stat half (added directly to the
// stat before that cap is checked) - see engineBridge.js's
// getSparkCapBonus/getSparkFlatStats and Tierlist.ts's soft-cap handling.
export default function BlueSparksSelector({ sparks, sparkBonuses, sparkFlatStats, maxSparks, onChange }) {
  function updateSlot(index, patch) {
    onChange(sparks.map((s, i) => (i === index ? { ...s, ...patch } : s)))
  }

  const activeCount = sparks.filter((s) => s.stat && s.star).length
  const hasBonuses = Object.keys(sparkBonuses || {}).length > 0 || Object.keys(sparkFlatStats || {}).length > 0

  return (
    <div className="scb-glow-card" style={{ padding: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, position: 'relative' }}>
        <h3 style={{ fontSize: '0.95rem', margin: 0 }}>
          Blue Sparks <span className="field-hint">({activeCount}/{maxSparks})</span>
        </h3>
      </div>

      <div className="scb-sparks-grid" style={{ position: 'relative' }}>
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
              {[1, 2, 3].map((star) => {
                const bonus = SPARK_BONUSES[star]
                return (
                  <option key={star} value={star}>
                    {STAR_LABELS[star]} {bonus ? `(+${bonus.cap} cap / +${bonus.stats} stats)` : ''}
                  </option>
                )
              })}
            </select>
          </div>
        ))}
      </div>

      {hasBonuses && (
        <div className="scb-sparks-summary" style={{ position: 'relative' }}>
          <span className="field-hint">Cap raise:</span>
          {Object.entries(sparkBonuses || {}).map(([stat, bonus]) => (
            <span key={`cap-${stat}`} className="pill" style={{ borderColor: statColor(displayStat(stat)) }}>
              {displayStat(stat)} +{bonus}
            </span>
          ))}
          <span className="field-hint" style={{ marginLeft: 10 }}>Flat stats:</span>
          {Object.entries(sparkFlatStats || {}).map(([stat, bonus]) => (
            <span key={`flat-${stat}`} className="pill" style={{ borderColor: statColor(displayStat(stat)) }}>
              {displayStat(stat)} +{bonus}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
