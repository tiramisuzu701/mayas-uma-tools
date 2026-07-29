import { Link } from 'react-router-dom'

export default function ToolCard({ to, icon, title, description, comingSoon }) {
  const content = (
    <div
      className="card"
      style={{
        padding: 24,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        opacity: comingSoon ? 0.55 : 1,
        transition: 'transform 0.15s ease, border-color 0.15s ease',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem',
          background: 'var(--surface-raised)',
          border: '1px solid var(--border)',
        }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div>
        <h3 style={{ fontSize: '1.05rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
          {title}
          {comingSoon && <span className="pill">Coming soon</span>}
        </h3>
        <p style={{ margin: 0, fontSize: '0.88rem' }}>{description}</p>
      </div>
    </div>
  )

  if (comingSoon) {
    return <div style={{ cursor: 'default' }}>{content}</div>
  }

  return (
    <Link
      to={to}
      style={{ display: 'block', height: '100%' }}
      className="tool-card-link"
    >
      {content}
    </Link>
  )
}
