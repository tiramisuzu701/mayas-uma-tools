import { GRADE_COLORS } from '../data/constants.js'

export default function GradeBadge({ grade, label }) {
  const color = GRADE_COLORS[grade] || '#78716c'
  return (
    <span
      title={label ? `${label}: ${grade}` : grade}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 22,
        height: 22,
        padding: '0 6px',
        borderRadius: 6,
        fontSize: '0.72rem',
        fontWeight: 800,
        color: '#17132b',
        background: color,
      }}
    >
      {grade}
    </span>
  )
}
