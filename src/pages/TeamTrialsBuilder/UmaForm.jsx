import { useState } from 'react'
import { CHARACTERS, CUSTOM_CHARACTER_ID } from '../../data/characters.js'
import { findBaseAptitudes } from '../../data/baseAptitudes.js'
import { STATS, TRACK_APTITUDES, DISTANCE_APTITUDES, RUNNING_STYLES } from '../../data/constants.js'
import GradeSelect from '../../components/GradeSelect.jsx'
import GradeBadge from '../../components/GradeBadge.jsx'
import PickerField from '../../components/PickerField.jsx'
import { blankUma } from '../../lib/uma.js'

const sortedCharacters = [...CHARACTERS].sort((a, b) => a.name.localeCompare(b.name))

const CHARACTER_OPTIONS = [
  { id: CUSTOM_CHARACTER_ID, name: '✎ Custom / not listed', characterId: null, isCustomOption: true },
  ...sortedCharacters.map((c) => ({ id: c.id, name: c.name, characterId: c.id })),
]

function renderCharacterPreview(opt) {
  if (opt.isCustomOption) {
    return (
      <div>
        <h4>Custom uma</h4>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-dim)' }}>
          Type in your own name and enter all stats/aptitudes by hand.
        </p>
      </div>
    )
  }

  const apt = findBaseAptitudes(opt.characterId)
  if (!apt) {
    return (
      <div>
        <h4>{opt.name}</h4>
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-faint)' }}>
          No base aptitude data on file for this one yet.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h4>{opt.name}</h4>
      <div className="picker-preview-section">
        <div className="picker-preview-grid">
          <span className="label">Turf</span>
          <GradeBadge grade={apt.track.turf} />
          <span className="label">Dirt</span>
          <GradeBadge grade={apt.track.dirt} />
        </div>
      </div>
      <div className="picker-preview-section">
        <div className="picker-preview-grid">
          <span className="label">Short</span>
          <GradeBadge grade={apt.distance.short} />
          <span className="label">Mile</span>
          <GradeBadge grade={apt.distance.mile} />
          <span className="label">Medium</span>
          <GradeBadge grade={apt.distance.medium} />
          <span className="label">Long</span>
          <GradeBadge grade={apt.distance.long} />
        </div>
      </div>
      <div className="picker-preview-section">
        <div className="picker-preview-grid">
          <span className="label">Front</span>
          <GradeBadge grade={apt.style.front} />
          <span className="label">Pace</span>
          <GradeBadge grade={apt.style.pace} />
          <span className="label">Late</span>
          <GradeBadge grade={apt.style.late} />
          <span className="label">End</span>
          <GradeBadge grade={apt.style.end} />
        </div>
      </div>
    </div>
  )
}

export default function UmaForm({ initialUma, onSave, onCancel }) {
  const [uma, setUma] = useState(() => initialUma || blankUma())
  const [error, setError] = useState('')

  const isCustom = uma.characterId === CUSTOM_CHARACTER_ID

  function updateStat(statId, value) {
    setUma((u) => ({ ...u, stats: { ...u.stats, [statId]: value } }))
  }

  function updateAptitude(group, key, value) {
    setUma((u) => ({
      ...u,
      aptitudes: { ...u.aptitudes, [group]: { ...u.aptitudes[group], [key]: value } },
    }))
  }

  function handleSelectCharacter(characterId) {
    setUma((u) => {
      const next = { ...u, characterId }
      if (characterId === CUSTOM_CHARACTER_ID) return next
      // Pre-fill base aptitudes as a starting point for this character - the
      // user can still adjust anything to match their actual trained result.
      const base = findBaseAptitudes(characterId)
      if (base) {
        next.aptitudes = {
          track: { ...base.track },
          distance: { ...base.distance },
          style: { ...base.style },
        }
        // Fall back to a sane grade for anything the database left blank.
        for (const group of ['track', 'distance', 'style']) {
          for (const key of Object.keys(next.aptitudes[group])) {
            if (!next.aptitudes[group][key]) next.aptitudes[group][key] = 'G'
          }
        }
      }
      return next
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!uma.characterId) {
      setError('Pick a character (or "Custom / not listed").')
      return
    }
    if (isCustom && !uma.customName.trim()) {
      setError('Enter a name for the custom character.')
      return
    }
    setError('')
    onSave(uma)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="field">
          <label>Character</label>
          <PickerField
            title="Choose a character"
            options={CHARACTER_OPTIONS}
            value={uma.characterId}
            onSelect={handleSelectCharacter}
            renderPreview={renderCharacterPreview}
            placeholder="Select a character..."
          />
        </div>

        {isCustom ? (
          <div className="field">
            <label>Custom name</label>
            <input
              type="text"
              value={uma.customName}
              onChange={(e) => setUma((u) => ({ ...u, customName: e.target.value }))}
              placeholder="e.g. Ninja Speed Star"
            />
          </div>
        ) : (
          <div className="field">
            <label>Nickname / label (optional)</label>
            <input
              type="text"
              value={uma.nickname}
              onChange={(e) => setUma((u) => ({ ...u, nickname: e.target.value }))}
              placeholder="e.g. Speed build, Anime ver."
            />
          </div>
        )}
      </div>

      {isCustom && (
        <div className="field">
          <label>Nickname / label (optional)</label>
          <input
            type="text"
            value={uma.nickname}
            onChange={(e) => setUma((u) => ({ ...u, nickname: e.target.value }))}
          />
        </div>
      )}

      <section>
        <h3 style={{ fontSize: '0.95rem', marginBottom: 12 }}>Stats</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {STATS.map((stat) => (
            <div className="field" key={stat.id}>
              <label>{stat.label}</label>
              <input
                type="number"
                min="0"
                max="3000"
                value={uma.stats[stat.id]}
                onChange={(e) => updateStat(stat.id, e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: '0.95rem', marginBottom: 12 }}>
          Track aptitude
          {!isCustom && findBaseAptitudes(uma.characterId) && (
            <span className="pill" style={{ marginLeft: 10, fontWeight: 500 }}>
              pre-filled from base data - adjust as needed
            </span>
          )}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {TRACK_APTITUDES.map((t) => (
            <GradeSelect
              key={t.id}
              label={t.label}
              value={uma.aptitudes.track[t.id]}
              onChange={(v) => updateAptitude('track', t.id, v)}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: '0.95rem', marginBottom: 12 }}>Distance aptitude</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {DISTANCE_APTITUDES.map((d) => (
            <GradeSelect
              key={d.id}
              label={d.label}
              value={uma.aptitudes.distance[d.id]}
              onChange={(v) => updateAptitude('distance', d.id, v)}
            />
          ))}
        </div>
      </section>

      <section>
        <h3 style={{ fontSize: '0.95rem', marginBottom: 12 }}>Running style aptitude</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {RUNNING_STYLES.map((s) => (
            <GradeSelect
              key={s.id}
              label={s.label}
              value={uma.aptitudes.style[s.id]}
              onChange={(v) => updateAptitude('style', s.id, v)}
            />
          ))}
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Running style this uma actually races as</label>
          <select
            value={uma.runningStyle}
            onChange={(e) => setUma((u) => ({ ...u, runningStyle: e.target.value }))}
          >
            {RUNNING_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="field">
          <label>Unique skill (optional)</label>
          <input
            type="text"
            value={uma.uniqueSkill}
            onChange={(e) => setUma((u) => ({ ...u, uniqueSkill: e.target.value }))}
          />
        </div>
        <div className="field">
          <label>Notes (optional)</label>
          <input
            type="text"
            value={uma.notes}
            onChange={(e) => setUma((u) => ({ ...u, notes: e.target.value }))}
          />
        </div>
      </div>

      {error && <p style={{ color: 'var(--red)', fontSize: '0.85rem', margin: 0 }}>{error}</p>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      </div>
    </form>
  )
}
