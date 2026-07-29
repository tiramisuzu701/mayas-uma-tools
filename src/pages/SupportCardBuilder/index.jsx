import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import SupportCardArt from '../../components/SupportCardArt.jsx'
import TierBoard from './TierBoard.jsx'
import BlueSparksSelector from './BlueSparksSelector.jsx'
import TrainingDistributionSelector from './TrainingDistributionSelector.jsx'
import CollectionManager from './CollectionManager.jsx'
import DeckStatPreview from './DeckStatPreview.jsx'
import {
  getScenarios,
  getDefaultOptionalRaces,
  generateTierlist,
  getCalculatedDistribution,
  getSparkCapBonus,
  getSparkFlatStats,
  getMaxStats,
  cardsData,
  MAX_SPARKS,
  FULL_LIMIT_BREAK_FILTER,
} from './engineBridge.js'
import { loadOwnedCards, saveOwnedCards, loadSparks, saveSparks } from './storage.js'

const DISTANCES = ['Sprint', 'Mile', 'Medium', 'Long']
const RUNNING_STYLES = ['Front Runner', 'Pace Chaser', 'Late Surger', 'End Closer']
const MAX_DECK_SIZE = 6
const DEBOUNCE_MS = 300

const TABS = [
  { id: 'deck', label: 'Deck Builder' },
  { id: 'collection', label: 'My Collection' },
]

function initialBoolMap(keys, activeKey) {
  return Object.fromEntries(keys.map((k) => [k, k === activeKey]))
}

export default function SupportCardBuilder() {
  const scenarios = useMemo(() => getScenarios(), [])

  const [tab, setTab] = useState('deck')

  const [distances, setDistances] = useState(() => initialBoolMap(DISTANCES, 'Medium'))
  const [runningStyles, setRunningStyles] = useState(() => initialBoolMap(RUNNING_STYLES, 'Pace Chaser'))
  const [scenario, setScenario] = useState(() => (scenarios.some((s) => s.key === 'GrandConcert') ? 'GrandConcert' : scenarios[0]?.key))
  const [mood, setMood] = useState(15)
  const [optionalRaces, setOptionalRaces] = useState(() => getDefaultOptionalRaces(scenario))
  const [deckCards, setDeckCards] = useState([])
  const [tierlistResult, setTierlistResult] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const [ownedCards, setOwnedCards] = useState(() => loadOwnedCards())
  const [sparks, setSparks] = useState(() => loadSparks(MAX_SPARKS))
  const [isManualDistribution, setIsManualDistribution] = useState(false)
  const [manualDistribution, setManualDistribution] = useState(null)

  const debounceRef = useRef(null)

  useEffect(() => {
    saveOwnedCards(ownedCards)
  }, [ownedCards])

  useEffect(() => {
    saveSparks(sparks)
  }, [sparks])

  const sparkBonuses = useMemo(() => getSparkCapBonus(sparks), [sparks])
  const sparkFlatStats = useMemo(() => getSparkFlatStats(sparks), [sparks])
  const maxStats = useMemo(() => getMaxStats(scenario), [scenario])

  // The deck's own auto-calculated training distribution, recomputed
  // whenever the deck or scenario changes - shown for reference, and used
  // to seed the manual override the moment it's first turned on.
  const calculatedDistribution = useMemo(
    () => getCalculatedDistribution(deckCards, scenario),
    [deckCards, scenario],
  )

  // Reset optional-race counts to the new scenario's defaults whenever the
  // scenario changes (mirrors Tachyon's Lab - each scenario has different
  // typical race counts, so switching scenarios without this would leave
  // stale numbers that don't make sense for it).
  useEffect(() => {
    setOptionalRaces(getDefaultOptionalRaces(scenario))
  }, [scenario])

  const deckCardIds = useMemo(
    () => new Set(deckCards.map((c) => `${c.id}-${c.limitBreak}`)),
    [deckCards],
  )

  // Auto-regenerate the tier list a little after anything relevant changes.
  // Tachyon's Lab only auto-regenerates on deck changes and requires a
  // manual "Generate" click for config changes (with a "stale" banner in
  // between) - this simplifies that into one debounced effect covering
  // everything, since Phase 1's config strip is small enough that recompute
  // cost isn't a concern and a single always-fresh board is less confusing.
  //
  // The engine itself is always run against every limit break for every
  // card (FULL_LIMIT_BREAK_FILTER) - the limit-break/hint-type/owned-only
  // filters in TierBoard are display-only, same as the original site (its
  // own limit-break filter default of "0LB + MLB only" lives in the display
  // layer, not in what gets computed).
  useEffect(() => {
    clearTimeout(debounceRef.current)
    setIsGenerating(true)
    debounceRef.current = setTimeout(() => {
      const result = generateTierlist({
        deckCards,
        distances,
        runningStyles,
        scenario,
        mood,
        optionalRaces,
        limitBreakFilter: FULL_LIMIT_BREAK_FILTER,
        sparks,
        manualDistribution: isManualDistribution ? manualDistribution : null,
      })
      setTierlistResult(result)
      setIsGenerating(false)
    }, DEBOUNCE_MS)
    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckCards, distances, runningStyles, scenario, mood, optionalRaces, sparks, isManualDistribution, manualDistribution])

  function toggleDistance(key) {
    setDistances((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleRunningStyle(key) {
    setRunningStyles((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function handleToggleManualDistribution(next) {
    setIsManualDistribution(next)
    if (next && !manualDistribution) {
      setManualDistribution(calculatedDistribution)
    }
  }

  // Same click semantics as Tachyon's Lab: clicking a card already in the
  // deck at an equal-or-higher limit break does nothing; clicking a higher
  // limit break of a card already in the deck swaps it in; a card sharing a
  // character with one already in the deck is blocked; otherwise it's added
  // if there's room (max 6).
  //
  // Wrapped in useCallback (stable reference across renders unless
  // deckCardIds/deckCards actually change) so TierBoard - which is
  // React.memo'd - doesn't re-render its full ~500-1000 tile grid every time
  // some unrelated piece of state on this page changes (a slider tick, a
  // number input keystroke, a tab switch).
  const handleCardClick = useCallback(
    (entry) => {
      const cardKey = `${entry.id}-${entry.limit_break}`
      if (deckCardIds.has(cardKey)) return

      const existing = deckCards.find((c) => c.id === entry.id)
      let next = deckCards
      if (existing) {
        if (entry.limit_break <= existing.limitBreak) return
        next = deckCards.filter((c) => c.id !== entry.id)
      } else {
        const sameChara = deckCards.find((c) => c.charaId === entry.chara_id)
        if (sameChara) return
      }
      if (next.length >= MAX_DECK_SIZE) return

      setDeckCards([
        ...next,
        {
          id: entry.id,
          charaId: entry.chara_id,
          limitBreak: entry.limit_break,
          cardName: entry.card_name,
          cardRarity: entry.card_rarity,
          cardType: entry.card_type,
        },
      ])
    },
    [deckCardIds, deckCards],
  )

  function removeCard(id) {
    setDeckCards((prev) => prev.filter((c) => c.id !== id))
  }

  function clearDeck() {
    setDeckCards([])
  }

  // Also stabilized with useCallback for the same reason as handleCardClick
  // above - this is called once per visible tile on every TierBoard render,
  // so keeping its identity stable (and TierBoard memoized) means unrelated
  // page state changes skip that work entirely instead of re-running it for
  // every card.
  const getCardDisabledInfo = useCallback(
    (entry) => {
      const cardKey = `${entry.id}-${entry.limit_break}`
      if (deckCardIds.has(cardKey)) return { disabled: true, reason: 'IN DECK' }

      const existing = deckCards.find((c) => c.id === entry.id)
      if (existing && existing.limitBreak > entry.limit_break) {
        return { disabled: true, reason: `${existing.limitBreak === 4 ? 'MLB' : `${existing.limitBreak}LB`} IN DECK` }
      }

      const sameChara = deckCards.find((c) => c.charaId === entry.chara_id && c.id !== entry.id)
      if (sameChara) return { disabled: true, reason: 'SAME CHARACTER' }

      // BUGFIX: a brand-new, non-conflicting card used to render as fully
      // clickable even with a full 6-card deck (this check only lived in
      // handleCardClick, which silently no-ops) - swaps (existing set) are
      // still allowed since they don't change the deck's size.
      if (!existing && deckCards.length >= MAX_DECK_SIZE) {
        return { disabled: true, reason: 'DECK FULL' }
      }

      return { disabled: false }
    },
    [deckCardIds, deckCards],
  )

  const success = tierlistResult && 'tierlist' in tierlistResult

  return (
    <div>
      <div className="page-heading">
        <span className="eyebrow">Tool</span>
        <h1>Support Card Tier List &amp; Deck Builder</h1>
        <p className="subtitle">
          Build a 6-card support deck and see a live tier list of every support card, scored by
          how much it'd actually improve <em>this</em> deck for the race distances, running
          styles, and training scenario you pick below.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border-soft)' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="btn btn-ghost"
            style={{
              borderRadius: '10px 10px 0 0',
              borderBottom: tab === t.id ? '2px solid var(--pink)' : '2px solid transparent',
              color: tab === t.id ? 'var(--text)' : 'var(--text-dim)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'collection' ? (
        <CollectionManager cardsData={cardsData} ownedCards={ownedCards} onChangeOwnedCards={setOwnedCards} />
      ) : (
        <>
          <div className="scb-glow-card" style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: 4, position: 'relative' }}>Generate Tierlist</h3>
            <p className="field-hint" style={{ marginBottom: 16, position: 'relative' }}>
              Configure the race distance and running style for your deck. These settings directly affect the
              grading and ranking of each support card.
            </p>

            <div className="scb-config-grid" style={{ position: 'relative' }}>
              <div className="field">
                <label>Race distance</label>
                <div className="toggle-pill-row">
                  {DISTANCES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`toggle-pill toggle-pill-blue ${distances[d] ? 'active' : ''}`}
                      onClick={() => toggleDistance(d)}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Running style</label>
                <div className="toggle-pill-row">
                  {RUNNING_STYLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`toggle-pill toggle-pill-green ${runningStyles[s] ? 'active' : ''}`}
                      onClick={() => toggleRunningStyle(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, position: 'relative' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)' }}>
                Deck ({deckCards.length}/{MAX_DECK_SIZE})
              </label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearDeck} disabled={deckCards.length === 0}>
                Clear deck
              </button>
            </div>

            {deckCards.length === 0 ? (
              <div className="empty-state" style={{ position: 'relative' }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 8 }}>🎴</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>No cards in deck</div>
                <div>Generate a tierlist below and click on cards to add them to your deck (max 6 cards)</div>
              </div>
            ) : (
              <div className="scb-deck-row" style={{ position: 'relative' }}>
                {deckCards.map((c) => (
                  <div key={c.id} className="scb-deck-slot">
                    <button
                      type="button"
                      className="scb-deck-slot-card"
                      onClick={() => removeCard(c.id)}
                      aria-label={`Remove ${c.cardName} from deck`}
                      title="Click to remove from deck"
                    >
                      <SupportCardArt cardId={c.id} name={c.cardName} width={96} />
                      <span className="scb-deck-slot-remove-overlay">✕ Remove</span>
                    </button>
                    <div className="scb-deck-slot-label">
                      {c.cardName} ({c.cardRarity} {c.limitBreak === 4 ? 'MLB' : `${c.limitBreak}LB`})
                    </div>
                  </div>
                ))}
                {Array.from({ length: MAX_DECK_SIZE - deckCards.length }).map((_, i) => (
                  <div key={`empty-${i}`} className="scb-deck-slot-empty">
                    Click a card below to add it
                  </div>
                ))}
              </div>
            )}
          </div>

          <TrainingDistributionSelector
            calculatedDistribution={calculatedDistribution}
            manualDistribution={manualDistribution}
            isManual={isManualDistribution}
            onToggleManual={handleToggleManualDistribution}
            onManualDistributionChange={setManualDistribution}
          />

          <BlueSparksSelector
            sparks={sparks}
            sparkBonuses={sparkBonuses}
            sparkFlatStats={sparkFlatStats}
            maxSparks={MAX_SPARKS}
            onChange={setSparks}
          />

          <div className="scb-glow-card" style={{ padding: 20, marginBottom: 24 }}>
            <div className="scb-config-grid" style={{ marginBottom: 0, position: 'relative' }}>
              <div className="field">
                <label htmlFor="scb-scenario">Scenario</label>
                <select id="scb-scenario" value={scenario} onChange={(e) => setScenario(e.target.value)}>
                  {scenarios.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="scb-mood">
                  Average Mood: {mood > 0 ? '+' : ''}
                  {mood}%
                </label>
                <input
                  id="scb-mood"
                  type="range"
                  min="-20"
                  max="20"
                  step="1"
                  value={mood}
                  onChange={(e) => setMood(parseInt(e.target.value, 10))}
                  className="scb-mood-slider"
                />
              </div>

              <div className="field">
                <label>Optional races</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    ['G1', 'G1'],
                    ['G2or3', 'G2/G3'],
                    ['PreOPorOP', 'Pre-OP/OP'],
                  ].map(([key, label]) => (
                    <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                      <span className="field-hint">{label}</span>
                      <input
                        type="number"
                        min="0"
                        max="20"
                        value={optionalRaces[key]}
                        onChange={(e) =>
                          setOptionalRaces((prev) => ({ ...prev, [key]: parseInt(e.target.value, 10) || 0 }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Only block on a full "Calculating..." message for the true first
              computation (no tier list has ever been produced yet). Once a
              result exists, DeckStatPreview/TierBoard stay mounted through
              every later recompute - unmounting them here would wipe out
              TierBoard's own filter state on every single deck/config change,
              which is what made the site feel like it was reloading. A
              small "Recalculating..." badge (rendered alongside the still-
              visible, slightly stale board) replaces that full blocking
              message for every change after the first. */}
          {isGenerating && !tierlistResult && <p className="field-hint">Calculating...</p>}

          {success && deckCards.length > 0 && (
            <DeckStatPreview deck={tierlistResult.deck} maxStats={maxStats} sparkCapBonus={sparkBonuses} />
          )}

          {success && (
            <>
              {isGenerating && <p className="scb-stale-indicator">Recalculating...</p>}
              <TierBoard
                tierlist={tierlistResult.tierlist}
                getCardDisabledInfo={getCardDisabledInfo}
                onCardClick={handleCardClick}
                ownedCards={ownedCards}
              />
            </>
          )}

          {!isGenerating && tierlistResult && !success && (
            <p className="empty-state">Couldn't generate a tier list: {tierlistResult.error}</p>
          )}
        </>
      )}

      <p className="scb-credit">
        Support card data and scoring engine adapted from{' '}
        <a href="https://github.com/Jechto/Tachyons-lab" target="_blank" rel="noreferrer">
          Tachyon's Lab
        </a>{' '}
        by Jechto, used with permission. Card art is hotlinked from GameTora's Uma Musume database.
      </p>
    </div>
  )
}
