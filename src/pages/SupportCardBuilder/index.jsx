import { useEffect, useMemo, useRef, useState } from 'react'
import SupportCardArt from '../../components/SupportCardArt.jsx'
import TierBoard from './TierBoard.jsx'
import BlueSparksSelector from './BlueSparksSelector.jsx'
import TrainingDistributionSelector from './TrainingDistributionSelector.jsx'
import CollectionManager from './CollectionManager.jsx'
import {
  getScenarios,
  getDefaultOptionalRaces,
  generateTierlist,
  getCalculatedDistribution,
  getSparkCapBonus,
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
  function handleCardClick(entry) {
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
  }

  function removeCard(id) {
    setDeckCards((prev) => prev.filter((c) => c.id !== id))
  }

  function clearDeck() {
    setDeckCards([])
  }

  function getCardDisabledInfo(entry) {
    const cardKey = `${entry.id}-${entry.limit_break}`
    if (deckCardIds.has(cardKey)) return { disabled: true, reason: 'IN DECK' }

    const existing = deckCards.find((c) => c.id === entry.id)
    if (existing && existing.limitBreak > entry.limit_break) {
      return { disabled: true, reason: `${existing.limitBreak === 4 ? 'MLB' : `${existing.limitBreak}LB`} IN DECK` }
    }

    const sameChara = deckCards.find((c) => c.charaId === entry.chara_id && c.id !== entry.id)
    if (sameChara) return { disabled: true, reason: 'SAME CHARACTER' }

    return { disabled: false }
  }

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
          <div className="card" style={{ padding: 20, marginBottom: 24 }}>
            <div className="scb-config-grid">
              <div className="field">
                <label>Race distance</label>
                <div className="toggle-pill-row">
                  {DISTANCES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`toggle-pill ${distances[d] ? 'active' : ''}`}
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
                      className={`toggle-pill ${runningStyles[s] ? 'active' : ''}`}
                      onClick={() => toggleRunningStyle(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label htmlFor="scb-scenario">Training scenario</label>
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
                  Average mood: {mood > 0 ? '+' : ''}
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-dim)' }}>
                Deck ({deckCards.length}/{MAX_DECK_SIZE})
              </label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearDeck} disabled={deckCards.length === 0}>
                Clear deck
              </button>
            </div>
            <div className="scb-deck-row">
              {deckCards.map((c) => (
                <div key={c.id} className="scb-deck-slot">
                  <button
                    type="button"
                    className="scb-deck-slot-remove"
                    onClick={() => removeCard(c.id)}
                    aria-label={`Remove ${c.cardName}`}
                    title="Remove from deck"
                  >
                    ✕
                  </button>
                  <SupportCardArt cardId={c.id} name={c.cardName} width={96} />
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
          </div>

          <BlueSparksSelector sparks={sparks} sparkBonuses={sparkBonuses} maxSparks={MAX_SPARKS} onChange={setSparks} />

          <TrainingDistributionSelector
            calculatedDistribution={calculatedDistribution}
            manualDistribution={manualDistribution}
            isManual={isManualDistribution}
            onToggleManual={handleToggleManualDistribution}
            onManualDistributionChange={setManualDistribution}
          />

          {isGenerating && <p className="field-hint">Calculating...</p>}

          {!isGenerating && success && (
            <TierBoard
              tierlist={tierlistResult.tierlist}
              getCardDisabledInfo={getCardDisabledInfo}
              onCardClick={handleCardClick}
              ownedCards={ownedCards}
            />
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
