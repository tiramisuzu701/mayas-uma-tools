import { useEffect, useState } from 'react'
import { PORTRAIT_URLS } from '../data/portraitUrls.js'

// Deterministic "pretty color" from a string, so the same character/name
// always gets the same placeholder color across the app.
function colorFromString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 62%, 42%)`
}

function initialsFromName(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Portrait sources, tried in order, each falling back to the next on error:
//   1. A locally-added file at public/portraits/{characterId}.png - always
//      wins if present, since it's something you chose to add yourself
//      (see public/portraits/README.md).
//   2. A hotlinked image URL from src/data/portraitUrls.js (sourced from
//      GameTora's global/English Uma Musume database - the image itself
//      is loaded by your browser directly from their CDN, never stored
//      in this repo). All 95 built-in characters currently have one.
//   3. A generated initials badge, so there's always *something* to show.
export default function Avatar({ characterId, name, size = 48 }) {
  const base = import.meta.env.BASE_URL
  const hotlinkUrl = characterId ? PORTRAIT_URLS[characterId] : undefined
  const localUrl = characterId && characterId !== '__custom__' ? `${base}portraits/${characterId}.png` : null

  const sources = [localUrl, hotlinkUrl].filter(Boolean)
  const [sourceIndex, setSourceIndex] = useState(0)

  // Reset back to the first source whenever the underlying character
  // changes (e.g. this Avatar instance gets reused for a different row).
  useEffect(() => {
    setSourceIndex(0)
  }, [characterId])

  const currentSrc = sources[sourceIndex]

  const style = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    color: '#fff',
    flexShrink: 0,
    overflow: 'hidden',
    fontSize: Math.max(11, size * 0.36),
    background: colorFromString(characterId || name || '?'),
    border: '1px solid rgba(255,255,255,0.12)',
  }

  if (currentSrc) {
    return (
      <div style={style}>
        <img
          key={currentSrc}
          src={currentSrc}
          alt={name}
          width={size}
          height={size}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={() => setSourceIndex((i) => i + 1)}
        />
      </div>
    )
  }

  return <div style={style}>{initialsFromName(name)}</div>
}
