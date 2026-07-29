// Shared color/icon theme for the Support Card Builder, used by every
// component that shows a stat or card-type badge (Deck Stat Preview, Score
// Breakdown, Training Distribution, Blue Sparks, the tier list's type filter,
// Collection Manager). Centralized here so the whole tool reads as one
// consistent palette instead of each component picking its own colors.
//
// The icon images themselves (assets/icons/*.png) are the actual game icons,
// copied from Tachyon's Lab's own public/images/icons/ folder (same
// permission/credit as the ported engine and card data - see the credit
// note on the SupportCardBuilder page and in the project README). Each
// image already has its colored rounded-square background baked in; the
// STAT_COLORS/TYPE_COLORS below are only used for the glow shadow and
// active-state border drawn around it, not as a literal background fill.

import speedIcon from './assets/icons/Speed.png'
import staminaIcon from './assets/icons/Stamina.png'
import powerIcon from './assets/icons/Power.png'
import gutsIcon from './assets/icons/Guts.png'
import witIcon from './assets/icons/Intelligence.png'
import skillPointIcon from './assets/icons/SkillPoint.png'
import supportIcon from './assets/icons/Support.png'
import buddyIcon from './assets/icons/Buddy.png'
import hintIcon from './assets/icons/Hint.png'

export const STAT_KEYS = ['Speed', 'Stamina', 'Power', 'Guts', 'Wit']

export const STAT_ICONS = {
  Speed: speedIcon,
  Stamina: staminaIcon,
  Power: powerIcon,
  Guts: gutsIcon,
  Wit: witIcon,
  'Skill Points': skillPointIcon,
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
  Speed: speedIcon,
  Stamina: staminaIcon,
  Power: powerIcon,
  Guts: gutsIcon,
  Wit: witIcon,
  Support: supportIcon,
  Buddy: buddyIcon,
}

export const TYPE_COLORS = {
  Speed: 'var(--blue)',
  Stamina: 'var(--red)',
  Power: 'var(--amber)',
  Guts: 'var(--pink)',
  Wit: 'var(--green)',
  Support: 'var(--gold)',
  Buddy: 'var(--lime)',
}

export const HINT_ICON = hintIcon

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
  return STAT_ICONS[stat] || null
}

export function statColor(stat) {
  return STAT_COLORS[stat] || 'var(--text-dim)'
}
