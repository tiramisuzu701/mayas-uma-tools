import { useRef, useState } from 'react'
import Avatar from '../../components/Avatar.jsx'
import GradeBadge from '../../components/GradeBadge.jsx'
import Modal from '../../components/Modal.jsx'
import { STATS, RUNNING_STYLES } from '../../data/constants.js'
import { characterName, displayName } from '../../lib/uma.js'
import { exportRosterAsFile, parseImportedRosterFile } from '../../lib/storage.js'
import UmaForm from './UmaForm.jsx'

export default function RosterManager({ roster, onAdd, onUpdate, onDelete }) {
  const [modalMode, setModalMode] = useState(null) // null | 'add' | { edit: umaId }
  const [importError, setImportError] = useState('')
  const fileInputRef = useRef(null)

  const editingUma = typeof modalMode === 'object' && modalMode?.edit
    ? roster.find((u) => u.id === modalMode.edit)
    : null

  function closeModal() {
    setModalMode(null)
  }

  function handleSave(uma) {
    if (modalMode === 'add') {
      onAdd(uma)
    } else if (editingUma) {
      onUpdate(editingUma.id, uma)
    }
    closeModal()
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const imported = parseImportedRosterFile(String(reader.result))
        imported.forEach((uma) => onAdd({ ...uma, id: undefined }))
        setImportError('')
      } catch (err) {
        setImportError(err.message || 'Could not read that file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div>
      <div className="glow-card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', position: 'relative' }}>
          <p style={{ margin: 0 }}>
            {roster.length} trained {roster.length === 1 ? 'uma' : 'umas'} saved in this browser.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-sm" onClick={() => fileInputRef.current?.click()}>
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
            <button className="btn btn-sm" onClick={() => exportRosterAsFile(roster)} disabled={roster.length === 0}>
              Export backup
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setModalMode('add')}>
              + Add uma
            </button>
          </div>
        </div>

        {importError && <p style={{ color: 'var(--red)', fontSize: '0.85rem', position: 'relative', marginTop: 10, marginBottom: 0 }}>{importError}</p>}
      </div>

      {roster.length === 0 ? (
        <div className="empty-state">
          <p>No trained umas yet. Add your first one to start building a Team Trials squad.</p>
          <button className="btn btn-primary" onClick={() => setModalMode('add')} style={{ marginTop: 12 }}>
            + Add uma
          </button>
        </div>
      ) : (
        <div className="glow-card scroll-x" style={{ padding: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760, position: 'relative' }}>
            <thead>
              <tr style={{ textAlign: 'left', fontSize: '0.75rem', color: 'var(--text-faint)' }}>
                <th style={{ padding: '0 10px 10px' }}>Uma</th>
                {STATS.map((s) => (
                  <th key={s.id} style={{ padding: '0 10px 10px' }}>
                    {s.label}
                  </th>
                ))}
                <th style={{ padding: '0 10px 10px' }}>Style</th>
                <th style={{ padding: '0 10px 10px' }} />
              </tr>
            </thead>
            <tbody>
              {roster.map((uma) => (
                <tr key={uma.id} style={{ borderTop: '1px solid var(--border-soft)' }}>
                  <td style={{ padding: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar characterId={uma.characterId} name={characterName(uma)} size={36} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{displayName(uma)}</div>
                        {uma.uniqueSkill && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>{uma.uniqueSkill}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  {STATS.map((s) => (
                    <td key={s.id} style={{ padding: '10px', fontVariantNumeric: 'tabular-nums' }}>
                      {uma.stats[s.id] || 0}
                    </td>
                  ))}
                  <td style={{ padding: '10px' }}>
                    <span className="pill">
                      {RUNNING_STYLES.find((s) => s.id === uma.runningStyle)?.label}
                      {' '}
                      <GradeBadge grade={uma.aptitudes.style[uma.runningStyle]} />
                    </span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setModalMode({ edit: uma.id })}>
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ marginLeft: 6 }}
                      onClick={() => {
                        if (confirm(`Remove ${displayName(uma)} from your roster?`)) onDelete(uma.id)
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(modalMode === 'add' || editingUma) && (
        <Modal title={modalMode === 'add' ? 'Add a trained uma' : `Edit ${displayName(editingUma)}`} onClose={closeModal} width={760}>
          <UmaForm initialUma={editingUma} onSave={handleSave} onCancel={closeModal} />
        </Modal>
      )}
    </div>
  )
}
