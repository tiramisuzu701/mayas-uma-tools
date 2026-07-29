import { memo, useMemo, useState } from 'react'
import { GRADES } from '../../data/constants.js'
import SupportCardArt from '../../components/SupportCardArt.jsx'
import CardTooltip from './CardTooltip.jsx'
import { SUPPORT_EFFECT_NAMES } from './engineBridge.js'
import { TYPE_ICONS, TYPE_COLORS, TIER_COLORS, RARITY_COLORS } from './statTheme.js'

// Fixed display order for the card-type filter row - matches the order
// Tachyon's Lab's own type selector uses. Any type not in this list
// (shouldn't happen with the current card data, but keeps this
// future-proof) sorts alphabetically after.
const TYPE_ORDER = ['Speed', 'Stamina', 'Power', 'Guts', 'Wit', 'Support', 'Buddy']

// Percentile cutoffs (of all cards' scores, across every type) used to band
// cards into S-G tiers - same cutoffs Tachyon's Lab's TierlistDisplay.tsx
// uses (5/15/30/50/70/85/95). This is a single GLOBAL ranking across every
// card type (not computed per-type), matching the reference site's one
// combined S-G tier list.
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

// One tier-list tile, extracted to its own component (rather than inline
// JSX in the .map() below) so it can be memoized. With up to ~470-1175
// cards mounted at once (every limit break of every card the current
// limit-break filter allows), re-rendering the entire grid on every
// TierBoard render (e.g. from an unrelated filter checkbox toggling) is the
// single biggest perf cost in this tool - memoizing lets React skip a tile
// entirely when nothing about it actually changed.
//
// `card` and `substatsToDisplay` are stable object/array references across
// re-renders that don't actually change the underlying data (see the
// useMemo calls in TierBoard below), so those can use plain reference
// equality. `disabledInfo` is recomputed fresh every render (it's cheap:
// a couple of Set/array lookups), so it gets a new object identity each
// time even when its actual `disabled`/`reason` values haven't changed -
// the custom comparator below checks those values directly instead of
// object identity so the tile still skips re-rendering in the common case.
const TierTile = memo(function TierTile({ card, disabledInfo, onCardClick, substatsToDisplay }) {
  return (
    <CardTooltip card={card} disabled={disabledInfo.disabled}>
      <button
        type="button"
        className={`scb-tier-tile ${disabledInfo.disabled ? 'scb-tier-tile-disabled' : ''}`}
        disabled={disabledInfo.disabled}
        onClick={() => onCardClick(card)}
      >
        <span className="scb-tier-tile-score">{card.score.toFixed(0)}</span>
        {substatsToDisplay.map(({ effectName, slot, color }) => (
          <span
            key={slot}
            className="scb-substat-badge"
            style={{ top: 6 + slot * 20, left: 6, right: 'auto', background: color }}
            title={effectName}
          >
            {Math.round(card.support_effects?.[effectName] || 0)}
          </span>
        ))}
        <SupportCardArt cardId={card.id} name={card.card_name} width={96} />
        <div className="scb-tier-tile-footer">
          <span
            className="scb-tier-tile-rarity"
            style={{ background: RARITY_COLORS[card.card_rarity] || 'var(--border)' }}
          >
            {card.card_rarity}
          </span>
          <span className="scb-tier-tile-lb">{lbLabel(card.limit_break)}</span>
        </div>
        {disabledInfo.disabled && (
          <span className="scb-tier-tile-disabled-reason">{disabledInfo.reason}</span>
        )}
      </button>
    </CardTooltip>
  )
}, (prev, next) =>
  prev.card === next.card &&
  prev.onCardClick === next.onCardClick &&
  prev.substatsToDisplay === next.substatsToDisplay &&
  prev.disabledInfo.disabled === next.disabledInfo.disabled &&
  prev.disabledInfo.reason === next.disabledInfo.reason,
)

// The whole board is memoized too - its props (tierlist, ownedCards, and
// the useCallback'd getCardDisabledInfo/onCardClick from the parent page)
// are all reference-stable between renders unless something that actually
// affects this tool's output changed, so an unrelated bit of page state
// (a slider tick, a keystroke elsewhere on the page) no longer forces this
// entire tool - filters, tier bucketing, and every tile - to recompute and
// re-render.
function TierBoard({ tierlist, getCardDisabledInfo, onCardClick, ownedCards }) {
  const [limitBreakFilter, setLimitBreakFilter] = useState(DEFAULT_LIMIT_BREAK_FILTER)
  const [hintTypeFilters, setHintTypeFilters] = useState(() => new Set())
  const [showOwnedOnly, setShowOwnedOnly] = useState(false)
  const [substatSlots, setSubstatSlots] = useState(['', '', '', ''])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState('All')

  const allEntries = useMemo(() => Object.values(tierlist).flat(), [tierlist])
  const assignTier = useMemo(() => buildTierAssigner(allEntries.map((c) => c.score)), [allEntries])

  const typesPresent = useMemo(() => {
    const present = new Set(allEntries.map((c) => c.card_type))
    const known = TYPE_ORDER.filter((t) => present.has(t))
    const unknown = [...present].filter((t) => !TYPE_ORDER.includes(t)).sort()
    return [...known, ...unknown]
  }, [allEntries])

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
  // Memoized so its reference stays stable across renders where the substat
  // selection hasn't changed - passed to every TierTile below, and TierTile's
  // memo comparator relies on reference equality for this prop.
  const substatsToDisplay = useMemo(
    () =>
      substatSlots
        .slice(0, visibleSlotCount)
        .map((effectName, slot) => (effectName ? { effectName, slot, color: SUBSTAT_SLOT_COLORS[slot] } : null))
        .filter(Boolean),
    [substatSlots, visibleSlotCount],
  )

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
    setTypeFilter('All')
  }

  // Substats are visual-only (badges on each tile) - they never remove a
  // card from the list, matching the original ("Filters are visual only
  // and don't affect scoring or tier placement").
  function passesFilters(card) {
    if (typeFilter !== 'All' && card.card_type !== typeFilter) return false
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

  // Bucket every card into its global S-G tier, most-impressive tier first,
  // and drop any tier that ends up empty once filters are applied - one
  // combined ranking across every card type, matching the reference site's
  // tier-list layout (rather than a separate ranking per type).
  //
  // Memoized: this is an O(n) filter + O(n log n) sort over up to ~1175
  // entries repeated for all 7 grades. Previously this ran on every
  // TierBoard render, including renders that had nothing to do with any of
  // its own inputs (e.g. re-renders bubbling down from a parent-level state
  // change now that TierBoard is memoized and its props are stable - but
  // this useMemo also protects against any future non-memoized parent).
  // passesFilters closes over typeFilter/limitBreakFilter/hintTypeFilters/
  // showOwnedOnly/ownedCards, all listed in the dependency array below, so
  // the memoized result always reflects the current filter state.
  //
  // IMPORTANT: this must run unconditionally, before the `allEntries.length
  // === 0` early return below - React requires the same hooks to run in the
  // same order on every render, and this component previously had that
  // early return ahead of where this useMemo lives, which would skip this
  // hook entirely on empty-tierlist renders while calling it on every other
  // render ("Rendered more/fewer hooks than during the previous render").
  const tiers = useMemo(
    () =>
      GRADES.map((grade) => {
        const cards = allEntries
          .filter((c) => assignTier(c.score) === grade && passesFilters(c))
          .sort((a, b) => b.score - a.score)
        return { grade, cards }
      }).filter((t) => t.cards.length > 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allEntries, assignTier, typeFilter, limitBreakFilter, hintTypeFilters, showOwnedOnly, ownedCards],
  )

  if (allEntries.length === 0) {
    return <p className="empty-state">No cards to show.</p>
  }

  const visibleCount = tiers.reduce((sum, t) => sum + t.cards.length, 0)

  return (
    <div>
      <div className="scb-glow-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, position: 'relative' }}>
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>Tierlist Visualization</h3>
            <p className="field-hint" style={{ margin: 0 }}>
              Cards are ranked by how much each would improve your current deck. Higher scores generally mean
              better performance - the numbers aren't related to the in-game grading you receive after a race.
            </p>
          </div>
          <span className="pill" style={{ whiteSpace: 'nowrap' }}>
            Showing {visibleCount} of {allEntries.length}
          </span>
        </div>

        <div style={{ marginTop: 16, marginBottom: 4, position: 'relative' }}>
          <label style={{ marginBottom: 8, display: 'block' }}>Card type</label>
          <div className="scb-type-filter-row">
            <button
              type="button"
              className={`scb-type-filter-btn ${typeFilter === 'All' ? 'active' : ''}`}
              style={{ '--badge-color': 'var(--purple)' }}
              onClick={() => setTypeFilter('All')}
              title="All types"
            >
              ✦
            </button>
            {typesPresent.map((t) => (
              <button
                key={t}
                type="button"
                className={`scb-type-filter-btn ${typeFilter === t ? 'active' : ''}`}
                style={{ '--badge-color': TYPE_COLORS[t] || 'var(--purple)' }}
                onClick={() => setTypeFilter(t)}
                title={t}
              >
                {TYPE_ICONS[t] ? <img src={TYPE_ICONS[t]} alt={t} /> : '◆'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 14, position: 'relative' }}>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setFiltersOpen((v) => !v)}>
            {filtersOpen ? 'Hide filters ▲' : 'Show filters ▼'}
          </button>
        </div>

        {filtersOpen && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 16, position: 'relative' }}>
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
                          className={`toggle-pill toggle-pill-blue ${limitBreakFilter[rarity].includes(lb) ? 'active' : ''}`}
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
                      className={`toggle-pill toggle-pill-green ${hintTypeFilters.has(h) ? 'active' : ''}`}
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
              <button type="button" className="btn btn-danger btn-sm" onClick={clearFilters}>Clear all filters</button>
            </div>
          </div>
        )}
      </div>

      {tiers.map(({ grade, cards }) => (
        <div key={grade} className="scb-tier-row">
          <div className="scb-tier-row-badge" style={{ '--tier-color': TIER_COLORS[grade] || 'var(--purple)' }}>
            {grade}
          </div>
          <div className="scb-tier-row-body">
            <div className="scb-tier-row-count">
              {cards.length} card{cards.length === 1 ? '' : 's'} • Score range: {cards[cards.length - 1].score.toFixed(0)} - {cards[0].score.toFixed(0)}
            </div>
            <div className="scb-tier-row-cards">
              {cards.map((card) => (
                <TierTile
                  key={`${card.id}-${card.limit_break}`}
                  card={card}
                  disabledInfo={getCardDisabledInfo(card)}
                  onCardClick={onCardClick}
                  substatsToDisplay={substatsToDisplay}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default memo(TierBoard)
