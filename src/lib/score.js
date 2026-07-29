import { GRADE_WEIGHT } from '../data/constants.js'

// How well a single trained uma fits a single race category. This is a
// rough heuristic (not an official Cygames formula - that isn't public) to
// help rank and auto-assign your roster. It rewards:
//  - a good track aptitude grade for the category's surface (turf/dirt)
//  - a good distance aptitude grade for the category's distance
//  - a good aptitude grade for the running style the uma actually runs
//  - stats that clear the community-guideline thresholds for that category
export function fitScore(uma, category) {
  const trackGrade = uma.aptitudes.track[category.trackKey] || 'G'
  const distanceGrade = uma.aptitudes.distance[category.distanceKey] || 'G'
  const styleGrade = uma.aptitudes.style[uma.runningStyle] || 'G'

  const trackWeight = GRADE_WEIGHT[trackGrade] || 1
  const distanceWeight = GRADE_WEIGHT[distanceGrade] || 1
  const styleWeight = GRADE_WEIGHT[styleGrade] || 1

  const statIds = Object.keys(category.thresholds)
  const statFit =
    statIds.reduce((sum, statId) => {
      const threshold = category.thresholds[statId]
      const actual = Number(uma.stats[statId]) || 0
      if (!threshold) return sum + 1
      return sum + Math.min(actual / threshold, 1.15)
    }, 0) / statIds.length

  const aptitudeScore = trackWeight * 4 + distanceWeight * 4 + styleWeight * 2
  const statScore = statFit * 100

  return aptitudeScore + statScore
}

// Human-readable reasons a given uma might underperform in a given slot -
// used to surface warnings in the Team Builder UI.
export function fitWarnings(uma, category) {
  const warnings = []
  const trackGrade = uma.aptitudes.track[category.trackKey] || 'G'
  const distanceGrade = uma.aptitudes.distance[category.distanceKey] || 'G'

  if (GRADE_WEIGHT[trackGrade] < GRADE_WEIGHT.A) {
    warnings.push(`${category.trackKey === 'dirt' ? 'Dirt' : 'Turf'} aptitude is only ${trackGrade} (A or higher recommended).`)
  }
  if (GRADE_WEIGHT[distanceGrade] < GRADE_WEIGHT.A) {
    const distLabel = category.distanceKey[0].toUpperCase() + category.distanceKey.slice(1)
    warnings.push(`${distLabel} distance aptitude is only ${distanceGrade} (A or higher recommended).`)
  }

  for (const [statId, threshold] of Object.entries(category.thresholds)) {
    const actual = Number(uma.stats[statId]) || 0
    if (actual < threshold) {
      const label = statId[0].toUpperCase() + statId.slice(1)
      warnings.push(`${label} is ${actual}, below the ~${threshold} guideline for ${category.label}.`)
    }
  }

  return warnings
}
