import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Avatar from './Avatar.jsx'

const ANIM_MS = 170

// One option button in the picker grid, extracted so it can be memoized -
// this list can hold all 95 built-in characters (plus any custom roster
// entries), and without memoization every option re-renders on every
// keystroke in the search box (since AnimatedPicker itself re-renders when
// `query` changes), even for options whose match/selected state didn't
// change. `opt` keeps a stable identity across re-renders as long as the
// underlying `options` array passed into AnimatedPicker doesn't change
// (filtering-by-search reuses the same objects, it just changes which ones
// are included), and `onEnter`/`onLeave`/`onSelectOption` are stabilized
// with useCallback below, so this only re-renders when an option's own
// `isSelected`/`disabled` state actually changes.
const PickerOption = memo(function PickerOption({ opt, isSelected, onEnter, onLeave, onSelectOption }) {
  return (
    <button
      type="button"
      disabled={opt.disabled}
      className={`picker-option ${isSelected ? 'picker-option-selected' : ''}`}
      onMouseEnter={(e) => onEnter(opt, e)}
      onMouseLeave={() => onLeave(opt)}
      onFocus={(e) => onEnter(opt, e)}
      onBlur={() => onLeave(opt)}
      onClick={() => onSelectOption(opt.id)}
    >
      <Avatar characterId={opt.characterId} name={opt.name} size={64} />
      <span className="picker-option-name">{opt.name}</span>
    </button>
  )
})

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

  const requestClose = useCallback(() => {
    setClosing(true)
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => {
      setClosing(false)
      onClose()
    }, ANIM_MS)
  }, [onClose])

  const q = query.trim().toLowerCase()
  // Memoized: this is a full pass over the option list (up to ~95 built-in
  // characters, or more for a large roster) on every keystroke - useMemo
  // keeps it from also re-running on renders unrelated to `query`/`options`
  // (e.g. a hover-driven `hovered` state update).
  const filtered = useMemo(
    () => (q ? options.filter((o) => o.name.toLowerCase().includes(q)) : options),
    [q, options],
  )

  const handleEnter = useCallback((opt, e) => {
    setHovered({ id: opt.id, rect: e.currentTarget.getBoundingClientRect() })
  }, [])
  const handleLeave = useCallback((opt) => {
    setHovered((h) => (h && h.id === opt.id ? null : h))
  }, [])
  const handleSelectOption = useCallback(
    (id) => {
      onSelect(id)
      requestClose()
    },
    [onSelect, requestClose],
  )

  if (!open && !closing) return null

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
              <PickerOption
                key={opt.id}
                opt={opt}
                isSelected={opt.id === value}
                onEnter={handleEnter}
                onLeave={handleLeave}
                onSelectOption={handleSelectOption}
              />
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
