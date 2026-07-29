import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Avatar from './Avatar.jsx'

const ANIM_MS = 170

// A searchable, animated grid popup used in place of a plain <select> -
// shows each option as a portrait + name card, and (optionally) a hover
// preview panel with extra detail (stats/aptitudes). Used by both the
// master character picker (UmaForm) and the roster picker (TeamBuilder),
// each supplying their own `options` and `renderPreview`.
//
// options: [{ id, name, characterId, disabled?, ...anything renderPreview needs }]
export default function AnimatedPicker({ open, onClose, title, options, value, onSelect, renderPreview }) {
  const [closing, setClosing] = useState(false)
  const [query, setQuery] = useState('')
  const [hovered, setHovered] = useState(null) // { id, rect }
  const closeTimer = useRef(null)

  useEffect(() => {
    if (open) {
      setClosing(false)
      setQuery('')
      setHovered(null)
    }
    return () => clearTimeout(closeTimer.current)
  }, [open])

  useEffect(() => {
    if (!open || closing) return
    function onKey(e) {
      if (e.key === 'Escape') requestClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, closing])

  function requestClose() {
    setClosing(true)
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      setClosing(false)
      onClose()
    }, ANIM_MS)
  }

  if (!open && !closing) return null

  const q = query.trim().toLowerCase()
  const filtered = q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options

  function handleEnter(opt, e) {
    setHovered({ id: opt.id, rect: e.currentTarget.getBoundingClientRect() })
  }
  function handleLeave(opt) {
    setHovered((h) => (h && h.id === opt.id ? null : h))
  }

  const hoveredOpt = hovered ? filtered.find((o) => o.id === hovered.id) : null

  return createPortal(
    <>
      <div
        className={`picker-backdrop ${closing ? 'picker-backdrop-out' : 'picker-backdrop-in'}`}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) requestClose()
        }}
      >
        <div className={`picker-panel ${closing ? 'picker-panel-out' : 'picker-panel-in'}`}>
          <div className="picker-header">
            <h3>{title}</h3>
            <input
              autoFocus
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="picker-search"
            />
            <button type="button" className="btn btn-ghost btn-sm" onClick={requestClose} aria-label="Close">
              ✕
            </button>
          </div>
          <div className="picker-grid">
            {filtered.map((opt) => (
              <button
                type="button"
                key={opt.id}
                disabled={opt.disabled}
                className={`picker-option ${opt.id === value ? 'picker-option-selected' : ''}`}
                onMouseEnter={(e) => handleEnter(opt, e)}
                onMouseLeave={() => handleLeave(opt)}
                onFocus={(e) => handleEnter(opt, e)}
                onBlur={() => handleLeave(opt)}
                onClick={() => {
                  onSelect(opt.id)
                  requestClose()
                }}
              >
                <Avatar characterId={opt.characterId} name={opt.name} size={64} />
                <span className="picker-option-name">{opt.name}</span>
              </button>
            ))}
            {filtered.length === 0 && <p className="picker-empty">No matches.</p>}
          </div>
        </div>
      </div>

      {hoveredOpt &&
        renderPreview &&
        (() => {
          const rect = hovered.rect
          const top = Math.min(rect.bottom + 10, window.innerHeight - 240)
          const left = Math.min(Math.max(rect.left, 12), Math.max(12, window.innerWidth - 272))
          return createPortal(
            <div className="picker-preview" style={{ top, left }}>
              {renderPreview(hoveredOpt)}
            </div>,
            document.body,
          )
        })()}
    </>,
    document.body,
  )
}
