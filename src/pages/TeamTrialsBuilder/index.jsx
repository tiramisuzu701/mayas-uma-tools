import { useEffect, useState } from 'react'
import { loadRoster, saveRoster, makeId } from '../../lib/storage.js'
import RosterManager from './RosterManager.jsx'
import TeamBuilder from './TeamBuilder.jsx'

const TABS = [
  { id: 'roster', label: 'My Roster' },
  { id: 'team', label: 'Team Builder' },
]

export default function TeamTrialsBuilder() {
  const [roster, setRoster] = useState(() => loadRoster())
  const [tab, setTab] = useState('roster')

  useEffect(() => {
    saveRoster(roster)
  }, [roster])

  function addUma(uma) {
    setRoster((prev) => [...prev, { ...uma, id: makeId() }])
  }

  function updateUma(id, updated) {
    setRoster((prev) => prev.map((u) => (u.id === id ? { ...updated, id } : u)))
  }

  function deleteUma(id) {
    setRoster((prev) => prev.filter((u) => u.id !== id))
  }

  return (
    <div>
      <div className="page-heading">
        <span className="eyebrow">Tool</span>
        <h1>Team Trials Builder</h1>
        <p className="subtitle">
          Log the stats and aptitudes of umas you've actually trained, then get help
          assigning your best 15 - an Ace plus two runners for each of Sprint, Mile,
          Medium, Long, and Dirt.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, borderBottom: '1px solid var(--border-soft)' }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="btn btn-ghost"
            style={{
              borderRadius: '10px 10px 0 0',
              borderBottom: tab === t.id ? '2px solid var(--pink)' : '2px solid transparent',
              color: tab === t.id ? 'var(--text)' : 'var(--text-dim)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'roster' ? (
        <RosterManager roster={roster} onAdd={addUma} onUpdate={updateUma} onDelete={deleteUma} />
      ) : (
        <TeamBuilder roster={roster} />
      )}
    </div>
  )
}
