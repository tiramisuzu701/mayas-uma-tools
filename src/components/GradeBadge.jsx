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
        minWidth: 25,
        height: 25,
        padding: '0 7px',
        borderRadius: 7,
        fontSize: '0.76rem',
        fontWeight: 800,
        color: '#17132b',
        background: color,
        boxShadow: `0 0 10px -2px ${color}`,
      }}
    >
      {grade}
    </span>
  )
}
