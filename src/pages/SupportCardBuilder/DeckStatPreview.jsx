import { STAT_KEYS, statIcon, statColor } from './statTheme.js'

// Maps the engine's rawStats/maxStats keys (which use "Intelligence") to the
// display key "Wit" used everywhere else in this UI.
function engineKey(stat) {
  return stat === 'Wit' ? 'Intelligence' : stat
}

function formatDelta(value) {
  if (!value) return '0'
  const rounded = Math.round(value)
  return rounded > 0 ? `+${rounded}` : `${rounded}`
}

// "Deck Stat Preview" + "Score Breakdown" - shows the deck's absolute stat
// totals against their scenario cap (Speed 517/1700) and a line-item receipt
// of how the tier-list score was calculated, matching the reference site's
// layout. Both come straight from Tierlist.bestCardForDeck's response
// (deck.rawStats / deck.scoreBreakdown) - see engine/classes/Tierlist.ts.
export default function DeckStatPreview({ deck, maxStats, sparkCapBonus }) {
  if (!deck) return null
  const breakdown = deck.scoreBreakdown

  const statTiles = [...STAT_KEYS, 'Skill Points'].map((stat) => {
    const key = engineKey(stat)
    const current = deck.rawStats?.[stat] ?? deck.rawStats?.[key] ?? 0
    const delta = deck.stats?.[stat] ?? deck.stats?.[key] ?? 0
    const max = stat === 'Skill Points' ? null : (maxStats?.[key] || 1200) + (sparkCapBonus?.[key] || 0)
    return { stat, current, delta, max }
  })

  return (
    <div className="scb-glow-card" style={{ padding: 20, marginBottom: 24 }}>
      <h3 style={{ fontSize: '1rem', marginBottom: 4, position: 'relative' }}>Deck Stat Preview</h3>
      <p className="field-hint" style={{ marginBottom: 14, position: 'relative' }}>
        Total stats acquired from training and racing with this deck. Numbers in parentheses are the delta versus an empty deck.
      </p>

      <div className="scb-stat-grid" style={{ position: 'relative', marginBottom: breakdown ? 22 : 0 }}>
        {statTiles.map(({ stat, current, delta, max }) => (
          <div key={stat} className="scb-stat-tile" style={{ '--badge-color': statColor(stat) }}>
            <div className="scb-icon-badge" style={{ '--badge-color': statColor(stat) }}>{statIcon(stat)}</div>
            <div className="scb-stat-tile-label">{stat}</div>
            <div className="scb-stat-tile-value">
              {Math.round(current)}
              {max != null && <span className="scb-stat-tile-max"> /{Math.round(max)}</span>}
            </div>
            <div className="scb-stat-tile-delta">({formatDelta(delta)})</div>
          </div>
        ))}
      </div>

      {breakdown && (
        <div style={{ position: 'relative' }}>
          <h4 style={{ fontSize: '0.86rem', marginBottom: 8 }}>Score Calculation Receipt</h4>
          <table className="scb-score-table">
            <thead>
              <tr>
                <th>Stat</th>
                <th>Units</th>
                <th>Weight</th>
                <th>Σ</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.statContributions.map((row) => (
                <tr key={row.stat}>
                  <td>
                    <span className="scb-score-row-stat">
                      {STAT_KEYS.includes(row.stat) || row.stat === 'Skill Points' ? (
                        <span className="scb-icon-badge scb-icon-badge-sm" style={{ '--badge-color': statColor(row.stat) }}>
                          {statIcon(row.stat)}
                        </span>
                      ) : row.icon_id ? (
                        <img
                          src={`https://gametora.com/images/umamusume/skill_icons/utx_ico_skill_${row.icon_id}.png`}
                          alt=""
                          width={22}
                          height={22}
                          style={{ borderRadius: 6 }}
                          onError={(e) => { e.currentTarget.style.display = 'none' }}
                        />
                      ) : (
                        <span className="scb-icon-badge scb-icon-badge-sm">✦</span>
                      )}
                      {row.stat}
                    </span>
                  </td>
                  <td>{Math.round(row.value)}</td>
                  <td>×{row.weight.toFixed(2)}</td>
                  <td>{Math.round(row.contribution)}</td>
                </tr>
              ))}
              <tr className="scb-score-subtotal">
                <td colSpan={3}>Subtotal</td>
                <td>{Math.round(breakdown.baseScore)}</td>
              </tr>
            </tbody>
          </table>

          {breakdown.staminaPenalty < 1 && (
            <>
              <div className="scb-score-penalty">
                Stamina Penalty ({Math.round((1 - breakdown.staminaPenalty) * 100)}% reduction)
              </div>
              <div className="scb-score-penalty-reason">{breakdown.staminaPenaltyReason}</div>
            </>
          )}
          {breakdown.speedPenalty < 1 && (
            <>
              <div className="scb-score-penalty">
                Speed Penalty ({Math.round((1 - breakdown.speedPenalty) * 100)}% reduction)
              </div>
              <div className="scb-score-penalty-reason">{breakdown.speedPenaltyReason}</div>
            </>
          )}
          {breakdown.raceBonusPenalty < 1 && (
            <>
              <div className="scb-score-penalty">
                Race Bonus Penalty ({Math.round((1 - breakdown.raceBonusPenalty) * 100)}% reduction)
              </div>
              <div className="scb-score-penalty-reason">{breakdown.raceBonusPenaltyReason}</div>
            </>
          )}

          <div className="scb-score-final">
            <span>Final Score</span>
            <span>{Math.round(breakdown.totalScore)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
