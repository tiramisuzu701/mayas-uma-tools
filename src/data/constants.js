// Domain data for the Team Trials Builder.
//
// Team Trials (チーム競技場) pits a squad of 15 trained Uma Musume against
// opponents across five race categories: Sprint, Mile, Medium, Long, and
// Dirt - three umas per category (your "Ace" plus two additional runners).
// Each uma can only be assigned to one slot across the whole 15. Placing
// well, staying positioned well mid-race, and activating skills (which
// leans on Wit) all contribute to your score, and fielding teammates with
// matching running styles in the same race can interfere with each other,
// so some style variety within a category's trio helps.
//
// The stat thresholds and per-category stamina targets below are informal
// community guidelines (roughly: Speed 1000+, Power 600+, Wit 500+, Guts
// 400+, Stamina scaling with distance) gathered from player guides rather
// than official numbers from Cygames - treat them as a rough sanity check,
// not a hard rule, since the meta shifts over time.

export const GRADES = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G']

// Higher is better - used for scoring/sorting.
export const GRADE_WEIGHT = GRADES.reduce((acc, g, i) => {
  acc[g] = GRADES.length - i
  return acc
}, {})

export const GRADE_COLORS = {
  S: '#ffce54',
  A: '#ff5da2',
  B: '#c084fc',
  C: '#60a5fa',
  D: '#4ade80',
  E: '#a8a29e',
  F: '#78716c',
  G: '#57534e',
}

export const RUNNING_STYLES = [
  { id: 'front', label: 'Front Runner' },
  { id: 'pace', label: 'Pace Chaser' },
  { id: 'late', label: 'Late Surger' },
  { id: 'end', label: 'End Closer' },
]

export const DISTANCE_APTITUDES = [
  { id: 'short', label: 'Short' },
  { id: 'mile', label: 'Mile' },
  { id: 'medium', label: 'Medium' },
  { id: 'long', label: 'Long' },
]

export const TRACK_APTITUDES = [
  { id: 'turf', label: 'Turf' },
  { id: 'dirt', label: 'Dirt' },
]

export const STATS = [
  { id: 'speed', label: 'Speed' },
  { id: 'stamina', label: 'Stamina' },
  { id: 'power', label: 'Power' },
  { id: 'guts', label: 'Guts' },
  { id: 'wit', label: 'Wit' },
]

// Three roster slots per race category: the Ace (your strongest fit) plus
// two additional runners.
export const TEAM_ROLES = [
  { id: 'ace', label: 'Ace' },
  { id: 'runner2', label: 'Runner 2' },
  { id: 'runner3', label: 'Runner 3' },
]

// One race category = one race, filled by 3 roster slots (see TEAM_ROLES).
// `distanceKey` / `trackKey` point at the aptitude fields on a roster entry
// that matter for that category.
export const RACE_CATEGORIES = [
  {
    id: 'sprint',
    label: 'Sprint',
    trackKey: 'turf',
    distanceKey: 'short',
    thresholds: { speed: 1000, stamina: 500, power: 600, guts: 400, wit: 500 },
  },
  {
    id: 'mile',
    label: 'Mile',
    trackKey: 'turf',
    distanceKey: 'mile',
    thresholds: { speed: 1000, stamina: 550, power: 600, guts: 400, wit: 500 },
  },
  {
    id: 'medium',
    label: 'Medium',
    trackKey: 'turf',
    distanceKey: 'medium',
    thresholds: { speed: 1000, stamina: 800, power: 600, guts: 400, wit: 500 },
  },
  {
    id: 'long',
    label: 'Long',
    trackKey: 'turf',
    distanceKey: 'long',
    thresholds: { speed: 950, stamina: 1100, power: 550, guts: 400, wit: 500 },
  },
  {
    id: 'dirt',
    label: 'Dirt',
    trackKey: 'dirt',
    distanceKey: 'mile',
    thresholds: { speed: 950, stamina: 700, power: 650, guts: 450, wit: 500 },
  },
]
