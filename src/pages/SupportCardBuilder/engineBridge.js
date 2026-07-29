// Thin adapter between the ported Tachyon's Lab scoring engine (TypeScript,
// under ./engine/) and the plain-JSX UI in this folder. Keeps every direct
// import of the engine classes/data in one place, so the UI components never
// have to know the engine's internal shapes beyond what's documented here.
//
// Ported from Tachyon's Lab (github.com/Jechto/Tachyons-lab) by Jechto,
// used with permission. See the credit note on the SupportCardBuilder page
// and in the project README.

import cardsData from './data/supportCards.json'
import { SupportCard } from './engine/classes/SupportCard'
import { DeckEvaluator } from './engine/classes/DeckEvaluator'
import { Tierlist, SUPPORT_EFFECT_NAMES } from './engine/classes/Tierlist'
import { TrainingData, MAX_SPARKS, SPARK_BONUSES } from './engine/config/trainingData'

// Phase 1's default: only 0LB and MLB copies of every card are shown. Phase
// 2 exposes a full per-rarity limit-break filter UI that overrides this.
export const DEFAULT_LIMIT_BREAK_FILTER = { R: [0, 4], SR: [0, 4], SSR: [0, 4] }
export const FULL_LIMIT_BREAK_FILTER = { R: [0, 1, 2, 3, 4], SR: [0, 1, 2, 3, 4], SSR: [0, 1, 2, 3, 4] }

// Re-exported so the UI never has to import the engine directly (keeps the
// "only engineBridge.js touches ./engine" rule from Phase 1 intact).
export { SUPPORT_EFFECT_NAMES, MAX_SPARKS, SPARK_BONUSES }

export function getScenarios() {
  // [{ key, name }, ...]
  return TrainingData.getScenarios()
}

export function getDefaultOptionalRaces(scenarioKey) {
  const [g1, g2or3, preOpOrOp] = TrainingData.getDefaultOptional(scenarioKey)
  return { G1: g1, G2or3: g2or3, PreOPorOP: preOpOrOp }
}

// Turns equipped blue-spark slots into the per-stat cap-bonus object the
// engine expects ({ Speed, Stamina, Power, Guts, Intelligence }). Only the
// cap-raise half of a spark's bonus is ever wired into scoring here -
// same as the original (its flat-stat half is display-only in its own
// spark summary, never passed to the scoring engine either).
export function getSparkCapBonus(sparks) {
  return TrainingData.getSparkBonuses(sparks || []).capBonus
}

// Builds a live DeckEvaluator from the lightweight deck-card records the UI
// keeps in state ({ id, limitBreak }), skipping any that fail to instantiate
// (e.g. stale ids) rather than throwing, so a bad deck doesn't blank the page.
function buildDeckEvaluator(deckCards, manualDistribution) {
  const evaluator = new DeckEvaluator()
  for (const dc of deckCards) {
    try {
      evaluator.addCard(new SupportCard(dc.id, dc.limitBreak, cardsData))
    } catch (err) {
      console.warn(`Failed to add card ${dc.id} (lb ${dc.limitBreak}) to deck evaluator:`, err)
    }
  }
  if (manualDistribution) {
    evaluator.setManualDistribution(manualDistribution)
  }
  return evaluator
}

// The deck's own auto-calculated training distribution (5 normalized
// weights: Speed/Stamina/Power/Guts/Wit) for the current deck + scenario,
// with no manual override applied - used both as the "calculated" reference
// shown alongside the manual override UI and to seed it when first enabled.
export function getCalculatedDistribution(deckCards, scenario) {
  const evaluator = buildDeckEvaluator(deckCards, null)
  return evaluator.getTrainingDistribution(scenario)
}

// Runs the full engine pipeline for the current config + deck and returns
// the raw TierlistResponse ({ tierlist, deck, inputDeck } on success, or
// { success: false, error } on failure) - unmodified from what the engine
// itself returns, so any future consumer can rely on the same shape the
// original site's UI does.
export function generateTierlist({
  deckCards,
  distances, // { Sprint, Mile, Medium, Long } booleans
  runningStyles, // { 'Front Runner', 'Pace Chaser', 'Late Surger', 'End Closer' } booleans
  scenario,
  mood,
  optionalRaces, // { G1, G2or3, PreOPorOP }
  limitBreakFilter = DEFAULT_LIMIT_BREAK_FILTER,
  sparks = null, // SparkSlot[6] or null
  manualDistribution = null, // number[5] (normalized) or null - only applied if provided
}) {
  try {
    const deckEvaluator = buildDeckEvaluator(deckCards, manualDistribution)
    const tierlist = new Tierlist()
    return tierlist.bestCardForDeck(
      deckEvaluator,
      distances,
      runningStyles,
      cardsData,
      limitBreakFilter,
      scenario,
      optionalRaces,
      mood,
      getSparkCapBonus(sparks),
    )
  } catch (err) {
    return { success: false, error: err?.toString?.() || String(err) }
  }
}

export { cardsData }
