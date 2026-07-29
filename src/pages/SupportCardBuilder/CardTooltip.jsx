import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const HINT_TYPE_COLORS = {
  'Front Runner': '#f87171',
  'Pace Chaser': '#60a5fa',
  'Late Surger': '#4ade80',
  'End Closer': '#c084fc',
  Sprint: '#fb923c',
  Mile: '#facc15',
  Medium: '#2dd4bf',
  Long: '#818cf8',
}

const TOOLTIP_WIDTH = 300
const TOOLTIP_MAX_HEIGHT = 420
const GAP = 10

function calculatePosition(rect) {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  let x = rect.right + GAP
  let y = rect.top

  if (x + TOOLTIP_WIDTH > viewportWidth) {
    x = rect.left - TOOLTIP_WIDTH - GAP
    if (x < GAP) x = GAP
  }
  if (y + TOOLTIP_MAX_HEIGHT > viewportHeight) {
    y = Math.max(GAP, viewportHeight - TOOLTIP_MAX_HEIGHT - GAP)
  }
  if (y < GAP) y = GAP

  return { x, y }
}

function formatStatChange(value, statName) {
  if (!value) return null
  const sign = value > 0 ? '+' : ''
  const label = statName === 'Skill Points' ? 'SP' : statName.slice(0, 3).toUpperCase()
  return { text: `${sign}${Math.round(value)} ${label}`, positive: value > 0 }
}

// Hover (or tap, on touch devices) tooltip showing a card's hint types, gold
// skill hints, and its stat contribution to the current deck. Ported from
// Tachyon's Lab's CardTooltip.tsx - ~same trigger/positioning behavior, but
// skill icons are hotlinked from GameTora instead of a locally-bundled
// asset, matching this site's card-art hotlinking (see SupportCardArt.jsx).
export default function CardTooltip({ card, disabled, children }) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const timeoutRef = useRef(null)
  const containerRef = useRef(null)
  const tooltipRef = useRef(null)

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])

  useEffect(() => {
    if (disabled && visible) setVisible(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled])

  useEffect(() => {
    if (isTouchDevice || !visible) return undefined
    function onMove(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setVisible(false)
      }
    }
    document.addEventListener('mousemove', onMove, true)
    return () => document.removeEventListener('mousemove', onMove, true)
  }, [isTouchDevice, visible])

  useEffect(() => {
    if (!isTouchDevice || !visible) return undefined
    function onOutside(e) {
      if (
        containerRef.current && !containerRef.current.contains(e.target) &&
        tooltipRef.current && !tooltipRef.current.contains(e.target)
      ) {
        setVisible(false)
      }
    }
    document.addEventListener('touchstart', onOutside, true)
    document.addEventListener('click', onOutside, true)
    return () => {
      document.removeEventListener('touchstart', onOutside, true)
      document.removeEventListener('click', onOutside, true)
    }
  }, [isTouchDevice, visible])

  // The container div uses `display: contents` so it doesn't affect the
  // surrounding grid/flex layout (see the JSX below) - but that also means
  // it never generates its own box, so `e.currentTarget.getBoundingClientRect()`
  // always returns a zero rect (0,0,0,0) in every browser, which is why the
  // tooltip used to always land pinned to the top-left corner regardless of
  // which card was actually hovered. Read the rect from the real rendered
  // child (the card button passed in as `children`) instead.
  function getTriggerRect(e) {
    return containerRef.current?.firstElementChild?.getBoundingClientRect() || e.currentTarget.getBoundingClientRect()
  }

  function handleMouseEnter(e) {
    if (isTouchDevice || disabled) return
    const rect = getTriggerRect(e)
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setPosition(calculatePosition(rect))
      setVisible(true)
    }, 150)
  }

  function handleMouseLeave() {
    if (isTouchDevice) return
    clearTimeout(timeoutRef.current)
    setVisible(false)
  }

  function handleTouchStart(e) {
    if (!isTouchDevice || disabled || visible) return
    const rect = getTriggerRect(e)
    setPosition(calculatePosition(rect))
    setVisible(true)
  }

  const hints = card.hints
  const usefulPct = hints?.useful_hints_rate ? hints.useful_hints_rate * 100 : 0
  const usefulColor = usefulPct >= 75 ? 'var(--green)' : usefulPct >= 50 ? 'var(--gold)' : usefulPct >= 25 ? 'var(--amber)' : 'var(--red)'
  const goldSkills = hints?.gold_skills || []
  const hintTypes = (card.hintTypes || []).filter((h) => h !== 'General')
  const deltaStats = card.stats_diff_only_added_to_deck || {}
  const deltaPills = Object.entries(deltaStats)
    .map(([stat, value]) => formatStatChange(value, stat))
    .filter(Boolean)

  return (
    <div
      ref={containerRef}
      style={{ display: 'contents' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
    >
      {children}
      {visible &&
        createPortal(
          <div
            ref={tooltipRef}
            className="scb-tooltip"
            style={{ left: position.x, top: position.y, maxHeight: TOOLTIP_MAX_HEIGHT, width: TOOLTIP_WIDTH }}
          >
            <div className="scb-tooltip-header">
              <strong>{card.card_name}</strong>
              <span className="pill">{card.card_rarity} {card.limit_break === 4 ? 'MLB' : `${card.limit_break}LB`}</span>
            </div>

            <div className="scb-tooltip-row">
              <span className="field-hint">Hints match running style</span>
              <span style={{ color: usefulColor, fontWeight: 700 }}>{Math.round(usefulPct)}%</span>
            </div>
            <div className="scb-tooltip-bar">
              <div className="scb-tooltip-bar-fill" style={{ width: `${Math.min(100, Math.max(0, usefulPct))}%`, background: usefulColor }} />
            </div>

            {hintTypes.length > 0 && (
              <div className="scb-tooltip-section">
                <div className="field-hint" style={{ marginBottom: 6 }}>Hint types</div>
                <div className="toggle-pill-row">
                  {hintTypes.map((h) => (
                    <span key={h} className="pill" style={{ borderColor: HINT_TYPE_COLORS[h] || 'var(--border)' }}>
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {goldSkills.length > 0 && (
              <div className="scb-tooltip-section">
                <div className="field-hint" style={{ marginBottom: 6 }}>Gold skill hints</div>
                <div className="toggle-pill-row">
                  {goldSkills.map((skill, i) => (
                    <span
                      key={`${skill.name}-${i}`}
                      className="pill scb-gold-skill"
                      style={{ opacity: skill.active ? 1 : 0.55, textDecoration: skill.active ? 'none' : 'line-through' }}
                      title={skill.active ? 'Active for your current race/style selection' : 'Not active for your current race/style selection'}
                    >
                      <img
                        src={`https://gametora.com/images/umamusume/skill_icons/utx_ico_skill_${skill.icon_id}.png`}
                        alt=""
                        width={14}
                        height={14}
                        style={{ borderRadius: 3 }}
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {deltaPills.length > 0 && (
              <div className="scb-tooltip-section">
                <div className="field-hint" style={{ marginBottom: 6 }}>Stat changes</div>
                <div className="toggle-pill-row">
                  {deltaPills.map(({ text, positive }) => (
                    <span
                      key={text}
                      className="pill"
                      style={{
                        background: positive ? 'color-mix(in srgb, var(--green) 25%, var(--surface-alt))' : 'color-mix(in srgb, var(--red) 25%, var(--surface-alt))',
                        borderColor: positive ? 'var(--green)' : 'var(--red)',
                        color: positive ? 'var(--green)' : 'var(--red)',
                      }}
                    >
                      {text}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>,
          document.body,
        )}
    </div>
  )
}
