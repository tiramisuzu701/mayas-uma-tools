import { statIcon, statColor } from './statTheme.js'

// Small reusable "colored glow + real game icon" badge, used everywhere a
// stat (Speed/Stamina/Power/Guts/Wit/Skill Points) needs a compact visual
// marker - Deck Stat Preview tiles, the Score Breakdown table, and Training
// Distribution rows. Centralized so all three render the icon identically
// instead of each re-implementing the <img>/fallback logic.
export default function IconBadge({ stat, small, className = '' }) {
  const icon = statIcon(stat)
  return (
    <span
      className={`scb-icon-badge ${small ? 'scb-icon-badge-sm' : ''} ${className}`.trim()}
      style={{ '--badge-color': statColor(stat) }}
    >
      {icon ? <img src={icon} alt={stat} /> : '◆'}
    </span>
  )
}
