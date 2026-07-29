// Shared color/icon theme for the Support Card Builder, used by every
// component that shows a stat or card-type badge (Deck Stat Preview, Score
// Breakdown, Training Distribution, Blue Sparks, the tier list's type filter,
// Collection Manager). Centralized here so the whole tool reads as one
// consistent palette instead of each component picking its own colors.
//
// Colors/icons loosely follow Tachyon's Lab's own scheme (book=Speed,
// heart=Stamina, flexed bicep=Power, flame=Guts, graduation cap=Wit,
// sparkles=Skill Points) so the two tools feel like the same kind of app.

export const STAT_KEYS = ['Speed', 'Stamina', 'Power', 'Guts', 'Wit']

export const STAT_ICONS = {
  Speed: '📘',
  Stamina: '❤️',
  Power: '💪',
  Guts: '🔥',
  Wit: '🎓',
  'Skill Points': '✨',
}

export const STAT_COLORS = {
  Speed: 'var(--blue)',
  Stamina: 'var(--red)',
  Power: 'var(--amber)',
  Guts: 'var(--pink)',
  Wit: 'var(--green)',
  'Skill Points': 'var(--purple)',
}

// Card-type filter row (tier list) + Collection Manager type filter - covers
// every value SupportCard.cardType.type can actually take, including the
// non-trainable "Support"/"Buddy" (friend) types.
export const TYPE_ICONS = {
  Speed: '📘',
  Stamina: '❤️',
  Power: '💪',
  Guts: '🔥',
  Wit: '🎓',
  Support: '🤝',
  Buddy: '🐾',
}

export const TYPE_COLORS = {
  Speed: 'var(--blue)',
  Stamina: 'var(--red)',
  Power: 'var(--amber)',
  Guts: 'var(--pink)',
  Wit: 'var(--green)',
  Support: 'var(--gold)',
  Buddy: 'var(--purple)',
}

// Tier badge colors for the global S-G tier list - deliberately a separate
// mapping from data/constants.js's GRADE_COLORS (used by Team Trials
// Builder), so restyling this tool can't visually regress that one.
export const TIER_COLORS = {
  S: '#f43f5e',
  A: '#fb923c',
  B: '#facc15',
  C: '#4ade80',
  D: '#38bdf8',
  E: '#a78bfa',
  F: '#94a3b8',
  G: '#64748b',
}

export const RARITY_COLORS = {
  SSR: 'var(--gold)',
  SR: 'var(--purple)',
  R: 'var(--blue)',
}

export function statIcon(stat) {
  return STAT_ICONS[stat] || '◆'
}

export function statColor(stat) {
  return STAT_COLORS[stat] || 'var(--text-dim)'
}
