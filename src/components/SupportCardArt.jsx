import { useEffect, useState } from 'react'

// Deterministic "pretty color" from a string, so the same card always gets
// the same placeholder color across the app (same trick as Avatar.jsx).
function colorFromString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 55%, 38%)`
}

function initialsFromName(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Support card art, hotlinked at runtime from GameTora's global (English)
// Uma Musume database - same sourcing pattern as Avatar.jsx uses for
// character portraits (see that file's comment block for the reasoning).
// Nothing is downloaded or stored in this repo; your browser fetches the
// image directly from GameTora's CDN. Falls back to a generated initials
// badge if the hotlinked image ever fails to load.
export default function SupportCardArt({ cardId, name, width = 96, className }) {
  const hotlinkUrl = cardId ? `https://gametora.com/images/umamusume/supports/support_card_s_${cardId}.png` : undefined
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [cardId])

  const height = Math.round(width * (4 / 3))

  const style = {
    width,
    height,
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
    overflow: 'hidden',
    fontSize: Math.max(11, width * 0.22),
    background: colorFromString(String(cardId) || name || '?'),
    border: '1px solid rgba(255,255,255,0.12)',
  }

  if (hotlinkUrl && !failed) {
    return (
      <div style={style} className={className}>
        <img
          src={hotlinkUrl}
          alt={name}
          width={width}
          height={height}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setFailed(true)}
        />
      </div>
    )
  }

  return (
    <div style={style} className={className}>
      {initialsFromName(name)}
    </div>
  )
}
