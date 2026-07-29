import { memo, useCallback, useMemo, useState } from 'react'
import Avatar from '../../components/Avatar.jsx'
import GradeBadge from '../../components/GradeBadge.jsx'
import PickerField from '../../components/PickerField.jsx'
import { RACE_CATEGORIES, TEAM_ROLES, RUNNING_STYLES, STATS } from '../../data/constants.js'
import { characterName, displayName } from '../../lib/uma.js'
import { fitScore, fitWarnings } from '../../lib/score.js'
import { computeOptimalAssignment } from '../../lib/assignment.js'

function emptyAssignment() {
  return Object.fromEntries(
    RACE_CATEGORIES.map((c) => [c.id, Object.fromEntries(TEAM_ROLES.map((r) => [r.id, null]))]),
  )
}

// All 15 (category, role) pairs as flat "slots" - each slot behaves just
// like a race-category for scoring purposes (fitScore only looks at the
// category fields), the role is just which of the 3 teammates it is.
function allSlots() {
  return RACE_CATEGORIES.flatMap((cat) => TEAM_ROLES.map((role) => ({ ...cat, role: role.id })))
}

export default function TeamBuilder({ roster }) {
  const [assignment, setAssignment] = useState(emptyAssignment)

  const rosterById = useMemo(() => Object.fromEntries(roster.map((u) => [u.id, u])), [roster])

  const usedIds = useMemo(() => {
    const set = new Set()
    for (const roles of Object.values(assignment)) {
      for (const umaId of Object.values(roles)) {
        if (umaId) set.add(umaId)
      }
    }
    return set
  }, [assignment])

  // useCallback'd (stable identity across renders, since it only uses the
  // functional-update form of setAssignment) so it can be passed directly
  // to each RoleSlot below instead of a fresh `(umaId) => setSlot(...)`
  // closure per slot per render - lets RoleSlot's own memoization actually
  // hold.
  const setSlot = useCallback((categoryId, roleId, umaId) => {
    setAssignment((prev) => ({
      ...prev,
      [categoryId]: { ...prev[categoryId], [roleId]: umaId || null },
    }))
  }, [])

  function autoFillAll() {
    if (roster.length === 0) return
    const slots = allSlots()
    const { assignment: result } = computeOptimalAssignment(roster, slots, fitScore)

    const next = emptyAssignment()
    RACE_CATEGORIES.forEach((cat) => {
      // Pull out the 3 candidates assigned to this category's slots, in
      // whatever order the solver picked, then rank them best-fit-first so
      // the strongest teammate becomes the Ace.
      const catCandidates = TEAM_ROLES.map((_, i) => result[RACE_CATEGORIES.indexOf(cat) * TEAM_ROLES.length + i]).filter(Boolean)
      catCandidates.sort((a, b) => fitScore(b, cat) - fitScore(a, cat))
      TEAM_ROLES.forEach((role, i) => {
        next[cat.id][role.id] = catCandidates[i]?.id || null
      })
    })
    setAssignment(next)
  }

  function autoFillRemaining() {
    const freeSlots = []
    for (const cat of RACE_CATEGORIES) {
      for (const role of TEAM_ROLES) {
        if (!assignment[cat.id][role.id]) freeSlots.push({ ...cat, role: role.id })
      }
    }
    if (freeSlots.length === 0) return
    const freeCandidates = roster.filter((u) => !usedIds.has(u.id))
    if (freeCandidates.length === 0) return
    const { assignment: result } = computeOptimalAssignment(freeCandidates, freeSlots, fitScore)
    setAssignment((prev) => {
      const next = { ...prev }
      freeSlots.forEach((slot, i) => {
        if (result[i]) {
          next[slot.id] = { ...next[slot.id], [slot.role]: result[i].id }
        }
      })
      return next
    })
  }

  function clearAll() {
    setAssignment(emptyAssignment())
  }

  // Flat list of every filled (category, role, uma) triple, for scoring/warnings.
  const filledEntries = []
  for (const cat of RACE_CATEGORIES) {
    for (const role of TEAM_ROLES) {
      const umaId = assignment[cat.id][role.id]
      if (umaId) filledEntries.push({ category: cat, role, uma: rosterById[umaId] })
    }
  }

  const totalScore = filledEntries.reduce((sum, { category, uma }) => sum + fitScore(uma, category), 0)

  // Running-style overlap matters WITHIN a single race (the 3 teammates
  // fielded together), not across different categories.
  const styleOverlapByCategory = useMemo(() => {
    const out = {}
    for (const cat of RACE_CATEGORIES) {
      const counts = {}
      for (const role of TEAM_ROLES) {
        const uma = rosterById[assignment[cat.id][role.id]]
        if (!uma) continue
        counts[uma.runningStyle] = (counts[uma.runningStyle] || 0) + 1
      }
      const dupes = Object.entries(counts).filter(([, c]) => c > 1)
      if (dupes.length) out[cat.id] = dupes
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment, rosterById])

  return (
    <div>
      <div className="glow-card" style={{ padding: 18, marginBottom: 22 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', position: 'relative' }}>
          <button className="btn btn-primary" onClick={autoFillAll} disabled={roster.length === 0}>
            Auto-fill best team
          </button>
          <button className="btn" onClick={autoFillRemaining} disabled={roster.length === 0}>
            Auto-fill empty slots
          </button>
          <button className="btn btn-ghost" onClick={clearAll}>
            Clear
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="pill">
              {filledEntries.length}/15 filled · Estimated fit score: {totalScore.toFixed(0)}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {RACE_CATEGORIES.map((category) => {
          const dupes = styleOverlapByCategory[category.id]

          return (
            <div key={category.id} className="glow-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, position: 'relative' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{category.label}</h3>
              </div>

              {dupes && dupes.length > 0 && (
                <div
                  style={{
                    marginBottom: 14,
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--amber)',
                    background: 'rgba(251, 191, 36, 0.08)',
                    fontSize: '0.78rem',
                    color: 'var(--text-dim)',
                    position: 'relative',
                  }}
                >
                  <strong style={{ color: 'var(--amber)' }}>Running style overlap in this race: </strong>
                  {dupes.map(([style, count]) => `${RUNNING_STYLES.find((s) => s.id === style)?.label} × ${count}`).join(', ')}
                  {' '}- teammates with the same running style can interfere with each other here. Consider diversifying.
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                  gap: 14,
                  position: 'relative',
                }}
              >
                {TEAM_ROLES.map((role) => (
                  <RoleSlot
                    key={role.id}
                    category={category}
                    role={role}
                    umaId={assignment[category.id][role.id]}
                    uma={rosterById[assignment[category.id][role.id]]}
                    roster={roster}
                    usedIds={usedIds}
                    onChange={setSlot}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Memoized so a change in one slot's assignment doesn't force every other
// slot to re-derive its warnings/score/options unless something it
// actually depends on (its own umaId/uma, the shared roster, or usedIds -
// which does change on every assignment change, since another slot's pick
// affects everyone else's available options) changed. `category`/`role`
// are stable references (from the module-level RACE_CATEGORIES/TEAM_ROLES
// constants), so this comparison is cheap and correct.
const RoleSlot = memo(function RoleSlot({ category, role, umaId, uma, roster, usedIds, onChange }) {
  const warnings = uma ? fitWarnings(uma, category) : []
  const score = uma ? fitScore(uma, category) : 0

  // Memoized: filtering/mapping the whole roster for every one of the 15
  // slots on every render adds up (15x the work it needs to be) even
  // though the roster itself is small - useMemo keeps this from re-running
  // when this slot's own inputs haven't changed.
  const options = useMemo(
    () =>
      roster
        .filter((u) => u.id === umaId || !usedIds.has(u.id))
        .map((u) => ({ id: u.id, name: displayName(u), characterId: u.characterId, umaRef: u })),
    [roster, usedIds, umaId],
  )

  const handleSelect = useCallback(
    (nextUmaId) => onChange(category.id, role.id, nextUmaId),
    [onChange, category.id, role.id],
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: 14,
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-soft)',
        background: 'var(--surface-alt)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="pill" style={{ background: role.id === 'ace' ? 'var(--accent-gradient)' : undefined, color: role.id === 'ace' ? '#17132b' : undefined, border: role.id === 'ace' ? 'none' : undefined }}>
          {role.label}
        </span>
        <span className="pill">{score ? score.toFixed(0) : '—'}</span>
      </div>

      <PickerField
        title={`Choose your ${role.label.toLowerCase()} for ${category.label}`}
        options={options}
        value={umaId}
        onSelect={handleSelect}
        placeholder="— Empty —"
        size={36}
        renderPreview={(opt) => renderRosterPreview(opt.umaRef, category)}
      />

      {warnings.length > 0 && (
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.72rem', color: 'var(--amber)' }}>
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}
    </div>
  )
})

function renderRosterPreview(uma, category) {
  return (
    <div>
      <h4>{displayName(uma)}</h4>
      <div className="picker-preview-section">
        <div className="picker-preview-grid">
          {STATS.map((s) => (
            <span key={s.id} className="label">
              {s.label}: <strong style={{ color: 'var(--text)' }}>{uma.stats[s.id] || 0}</strong>
            </span>
          ))}
        </div>
      </div>
      <div className="picker-preview-section">
        <div className="picker-preview-grid">
          <span className="label">Track ({category.trackKey})</span>
          <GradeBadge grade={uma.aptitudes.track[category.trackKey]} />
          <span className="label">Distance ({category.distanceKey})</span>
          <GradeBadge grade={uma.aptitudes.distance[category.distanceKey]} />
          <span className="label">Style ({uma.runningStyle})</span>
          <GradeBadge grade={uma.aptitudes.style[uma.runningStyle]} />
        </div>
      </div>
    </div>
  )
}
