import { useMemo, useState } from 'react'
import { GRADES, GRADE_COLORS } from '../../data/constants.js'
import SupportCardArt from '../../components/SupportCardArt.jsx'
import CardTooltip from './CardTooltip.jsx'
import { SUPPORT_EFFECT_NAMES } from './engineBridge.js'

// Fixed display order for card types - matches the order Tachyon's Lab's own
// type selector uses. Any type not in this list (shouldn't happen with the
// current card data, but keeps this future-proof) sorts alphabetically after.
const TYPE_ORDER = ['Speed', 'Stamina', 'Power', 'Guts', 'Wit', 'Support', 'Buddy']

// Percentile cutoffs (of all cards' scores, across every type) used to band
// cards into S-G tiers - same cutoffs Tachyon's Lab's TierlistDisplay.tsx
// uses (5/15/30/50/70/85/95), just re-expressed against this site's existing
// GRADES/GRADE_COLORS (already S-G, already used by Team Trials Builder).
const PERCENTILE_CUTOFFS = { S: 5, A: 15, B: 30, C: 50, D: 70, E: 85, F: 95 }

const HINT_TYPE_ORDER = ['Front Runner', 'Pace Chaser', 'Late Surger', 'End Closer', 'Sprint', 'Mile', 'Medium', 'Long']

const SUBSTAT_SLOT_COLORS = ['#e11d48', '#2563eb', '#7c3aed', '#059669']
const DEFAULT_LIMIT_BREAK_FILTER = { R: [0, 4], SR: [0, 4], SSR: [0, 4] }

function buildTierAssigner(allScores) {
  const sorted = [...allScores].sort((a, b) => b - a)
  const scoreAtPercentile = (p) => {
    if (sorted.length === 0) return 0
    const index = Math.floor((p / 100) * sorted.length)
    return sorted[Math.min(index, sorted.length - 1)] ?? 0
  }
  const cutoffs = GRADES.slice(0, 7).map((grade) => ({
    grade,
    minScore: scoreAtPercentile(PERCENTILE_CUTOFFS[grade]),
  }))
  return (score) => {
    for (const { grade, minScore } of cutoffs) {
      if (score >= minScore) return grade
    }
    return 'G'
  }
}

function lbLabel(limitBreak) {
  return limitBreak === 4 ? 'MLB' : `${limitBreak}LB`
}

function orderedTypes(tierlist) {
  const present = Object.keys(tierlist)
  const known = TYPE_ORDER.filter((t) => present.includes(t))
  const unknown = present.filter((t) => !TYPE_ORDER.includes(t)).sort()
  return [...known, ...unknown]
}

function sortHintTypes(types) {
  return [...types].sort((a, b) => {
    const ia = HINT_TYPE_ORDER.indexOf(a)
    const ib = HINT_TYPE_ORDER.indexOf(b)
    if (ia !== -1 && ib !== -1) return ia - ib
    if (ia !== -1) return -1
    if (ib !== -1) return 1
    return a.localeCompare(b)
  })
}

export default function TierBoard({ tierlist, getCardDisabledInfo, onCardClick, ownedCards }) {
  const [limitBreakFilter, setLimitBreakFilter] = useState(DEFAULT_LIMIT_BREAK_FILTER)
  const [hintTypeFilters, setHintTypeFilters] = useState(() => new Set())
  const [showOwnedOnly, setShowOwnedOnly] = useState(false)
  const [substatSlots, setSubstatSlots] = useState(['', '', '', ''])
  const [filtersOpen, setFiltersOpen] = useState(false)

  const allEntries = useMemo(() => Object.values(tierlist).flat(), [tierlist])
  const assignTier = useMemo(() => buildTierAssigner(allEntries.map((c) => c.score)), [allEntries])
  const types = useMemo(() => orderedTypes(tierlist), [tierlist])

  const allHintTypes = useMemo(() => {
    const set = new Set()
    for (const c of allEntries) {
      for (const h of c.hintTypes || []) {
        if (h !== 'General') set.add(h)
      }
    }
    return sortHintTypes(Array.from(set))
  }, [allEntries])

  const firstEmptySlot = substatSlots.findIndex((s) => s === '')
  const visibleSlotCount = firstEmptySlot === -1 ? substatSlots.length : firstEmptySlot + 1
  const substatsToDisplay = substatSlots
    .slice(0, visibleSlotCount)
    .map((effectName, slot) => (effectName ? { effectName, slot, color: SUBSTAT_SLOT_COLORS[slot] } : null))
    .filter(Boolean)

  function toggleHintType(type) {
    setHintTypeFilters((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  function handleLimitBreakChange(rarity, lb, checked) {
    setLimitBreakFilter((prev) => {
      const updated = { ...prev }
      updated[rarity] = checked
        ? [...new Set([...updated[rarity], lb])].sort()
        : updated[rarity].filter((v) => v !== lb)
      return updated
    })
  }

  function toggleAllForRarity(rarity) {
    setLimitBreakFilter((prev) => {
      const allSelected = prev[rarity].length === 5
      return { ...prev, [rarity]: allSelected ? [] : [0, 1, 2, 3, 4] }
    })
  }

  function handleSubstatSlotChange(slotIndex, value) {
    setSubstatSlots((prev) => {
      const next = [...prev]
      if (value === '') {
        for (let i = slotIndex; i < next.length; i++) next[i] = ''
        return next
      }
      for (let i = 0; i < next.length; i++) {
        if (i !== slotIndex && next[i] === value) next[i] = ''
      }
      next[slotIndex] = value
      // BUGFIX: clearing an earlier slot's duplicate above could leave a gap
      // before slotIndex (e.g. slot 0 had "Speed Bonus", user then picks
      // "Speed Bonus" for slot 2 - slot 0 clears to ''). visibleSlotCount is
      // derived from the first empty slot, so that earlier gap used to hide
      // every slot from that point on - including the one the user just set.
      // Compact so filled values are always contiguous from index 0 (a
      // selected substat may shift toward an earlier slot when this happens,
      // but it stays visible instead of disappearing).
      const compacted = next.filter((v) => v !== '')
      while (compacted.length < next.length) compacted.push('')
      return compacted
    })
  }

  function toggleShowOwnedOnly(checked) {
    setShowOwnedOnly(checked)
    if (checked) setLimitBreakFilter({ R: [0, 1, 2, 3, 4], SR: [0, 1, 2, 3, 4], SSR: [0, 1, 2, 3, 4] })
  }

  function clearFilters() {
    setLimitBreakFilter(DEFAULT_LIMIT_BREAK_FILTER)
    setHintTypeFilters(new Set())
    setShowOwnedOnly(false)
    setSubstatSlots(['', '', '', ''])
  }

  // Substats are visual-only (badges on each tile) - they never remove a
  // card from the list, matching the original ("Filters are visual only
  // and don't affect scoring or tier placement").
  function passesFilters(card) {
    const rarity = card.card_rarity
    if (limitBreakFilter[rarity] && !limitBreakFilter[rarity].includes(card.limit_break)) return false
    if (hintTypeFilters.size > 0) {
      const hasMatch = (card.hintTypes || []).some((h) => hintTypeFilters.has(h))
      if (!hasMatch) return false
    }
    if (showOwnedOnly) {
      const ownedLevel = ownedCards[card.id]
      if (ownedLevel === undefined || card.limit_break !== ownedLevel) return false
    }
    return true
  }

  if (types.length === 0) {
    return <p className="empty-state">No cards to show.</p>
  }

  return (
    <div>
      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFiltersOpen((v) => !v)}>
          {filtersOpen ? 'Hide filters ▲' : 'Show filters ▼'}
        </button>

        {filtersOpen && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={showOwnedOnly} onChange={(e) => toggleShowOwnedOnly(e.target.checked)} />
                Show owned cards only ({Object.keys(ownedCards || {}).length} in collection)
              </label>
            </div>

            <div>
              <label style={{ marginBottom: 8, display: 'block' }}>Limit break</label>
              <div className="scb-config-grid" style={{ marginBottom: 0 }}>
                {['R', 'SR', 'SSR'].map((rarity) => (
                  <div key={rarity}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <strong style={{ fontSize: '0.8rem' }}>{rarity}</strong>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleAllForRarity(rarity)}>
                        {limitBreakFilter[rarity].length === 5 ? 'Clear' : 'Select all'}
                      </button>
                    </div>
                    <div className="toggle-pill-row">
                      {[0, 1, 2, 3, 4].map((lb) => (
                        <label
                          key={lb}
                          className={`toggle-pill ${limitBreakFilter[rarity].includes(lb) ? 'active' : ''}`}
                          style={{ cursor: 'pointer' }}
                        >
                          <input
                            type="checkbox"
                            checked={limitBreakFilter[rarity].includes(lb)}
                            onChange={(e) => handleLimitBreakChange(rarity, lb, e.target.checked)}
                            style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                          />
                          {lbLabel(lb)}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {allHintTypes.length > 0 && (
              <div>
                <label style={{ marginBottom: 8, display: 'block' }}>Hint types</label>
                <div className="toggle-pill-row">
                  {allHintTypes.map((h) => (
                    <button
                      key={h}
                      type="button"
                      className={`toggle-pill ${hintTypeFilters.has(h) ? 'active' : ''}`}
                      onClick={() => toggleHintType(h)}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label style={{ marginBottom: 8, display: 'block' }}>
                Substat display <span className="field-hint">(badges only - doesn't filter or affect scoring)</span>
              </label>
              <div className="scb-config-grid" style={{ marginBottom: 0 }}>
                {substatSlots.slice(0, visibleSlotCount).map((value, i) => (
                  <select
                    key={i}
                    value={value}
                    onChange={(e) => handleSubstatSlotChange(i, e.target.value)}
                    style={{ borderColor: SUBSTAT_SLOT_COLORS[i] }}
                  >
                    <option value="">None</option>
                    {SUPPORT_EFFECT_NAMES.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                ))}
              </div>
            </div>

            <div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear all filters</button>
            </div>
          </div>
        )}
      </div>

      {types.map((type) => {
        const cardsOfType = tierlist[type].filter(passesFilters)
        if (cardsOfType.length === 0) return null
        return (
          <div key={type} className="scb-tier-type-section">
            <div className="scb-tier-type-heading">
              <h3 style={{ margin: 0, fontSize: '1rem' }}>{type}</h3>
              <span className="pill">{cardsOfType.length} cards</span>
            </div>
            <div className="scb-tier-grid">
              {cardsOfType.map((card) => {
                const tier = assignTier(card.score)
                const disabledInfo = getCardDisabledInfo(card)
                return (
                  <CardTooltip key={`${card.id}-${card.limit_break}`} card={card} disabled={disabledInfo.disabled}>
                    <button
                      type="button"
                      className={`scb-tier-card ${disabledInfo.disabled ? 'scb-tier-card-disabled' : ''}`}
                      disabled={disabledInfo.disabled}
                      onClick={() => onCardClick(card)}
                      title={`${card.card_name} (${card.card_rarity} ${lbLabel(card.limit_break)}) - score ${card.score.toFixed(1)}`}
                    >
                      <span className="scb-tier-badge" style={{ background: GRADE_COLORS[tier] }}>
                        {tier}
                      </span>
                      {substatsToDisplay.map(({ effectName, slot, color }) => (
                        <span
                          key={slot}
                          className="scb-substat-badge"
                          style={{ top: 6 + slot * 20, background: color }}
                          title={effectName}
                        >
                          {Math.round(card.support_effects?.[effectName] || 0)}
                        </span>
                      ))}
                      <SupportCardArt cardId={card.id} name={card.card_name} width={72} />
                      <span className="scb-tier-card-name">{card.card_name}</span>
                      <span className="pill">
                        {card.card_rarity} {lbLabel(card.limit_break)}
                      </span>
                      <span className="scb-tier-card-score">{card.score.toFixed(1)}</span>
                      {disabledInfo.disabled && (
                        <span className="scb-tier-card-disabled-reason">{disabledInfo.reason}</span>
                      )}
                    </button>
                  </CardTooltip>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
