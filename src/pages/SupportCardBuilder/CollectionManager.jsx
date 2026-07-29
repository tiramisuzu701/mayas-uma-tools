import { useMemo, useState } from 'react'
import SupportCardArt from '../../components/SupportCardArt.jsx'
import { exportOwnedCardsCode, importOwnedCardsCode, downloadOwnedCardsFile } from './storage.js'

const RARITY_SYMBOL = { 1: 'R', 2: 'SR', 3: 'SSR' }
const TYPE_ORDER = ['Speed', 'Stamina', 'Power', 'Guts', 'Wit', 'Support', 'Buddy']
const OWNERSHIP_LABELS = { '-1': 'Not owned', 0: '0LB', 1: '1LB', 2: '2LB', 3: '3LB', 4: 'MLB' }

function cardType(raw) {
  return raw === 'Intelligence' ? 'Wit' : raw
}

// Mark which support cards you actually own (and at what limit break), so
// the tier board's "owned only" filter has something to filter by. Ported
// from Tachyon's Lab's CardCollectionManager - same "one dropdown per
// card" ownership model and import/export-code idea, adapted to this
// site's storage helpers (see storage.js) rather than ported verbatim,
// since this part of the original isn't the scoring engine and has no
// numeric-parity requirement.
export default function CollectionManager({ cardsData, ownedCards, onChangeOwnedCards }) {
  const [typeFilter, setTypeFilter] = useState('All')
  const [rarityFilter, setRarityFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [showImport, setShowImport] = useState(false)
  const [importValue, setImportValue] = useState('')
  const [exportCode, setExportCode] = useState('')
  const [message, setMessage] = useState(null)

  const uniqueCards = useMemo(() => {
    const seen = new Map()
    for (const c of cardsData) {
      if (!seen.has(c.id)) seen.set(c.id, c)
    }
    return Array.from(seen.values())
  }, [cardsData])

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase()
    return uniqueCards
      .filter((c) => typeFilter === 'All' || cardType(c.prefered_type) === typeFilter)
      .filter((c) => rarityFilter === 'All' || RARITY_SYMBOL[c.rarity] === rarityFilter)
      .filter((c) => !q || (c.card_chara_name || '').toLowerCase().includes(q))
      .sort((a, b) => (b.rarity || 0) - (a.rarity || 0) || a.id - b.id)
  }, [uniqueCards, typeFilter, rarityFilter, search])

  const ownedCount = Object.keys(ownedCards).length

  function setOwnership(cardId, level) {
    const next = { ...ownedCards }
    if (level === -1) {
      delete next[cardId]
    } else {
      next[cardId] = level
    }
    onChangeOwnedCards(next)
  }

  function flashMessage(type, text) {
    setMessage({ type, text })
    setTimeout(() => setMessage((m) => (m?.text === text ? null : m)), 4000)
  }

  async function handleExportCode() {
    try {
      const code = exportOwnedCardsCode(ownedCards)
      setExportCode(code)
      setShowImport(false)
      try {
        await navigator.clipboard.writeText(code)
        flashMessage('success', 'Code copied to clipboard.')
      } catch {
        flashMessage('success', 'Code generated - copy it below.')
      }
    } catch {
      flashMessage('error', 'Failed to generate a code.')
    }
  }

  function handleDownload() {
    try {
      downloadOwnedCardsFile(ownedCards)
      flashMessage('success', 'Collection file downloaded.')
    } catch {
      flashMessage('error', 'Failed to download file.')
    }
  }

  function handleImport() {
    try {
      const imported = importOwnedCardsCode(importValue)
      onChangeOwnedCards(imported)
      setImportValue('')
      setShowImport(false)
      flashMessage('success', `Imported ${Object.keys(imported).length} owned card(s).`)
    } catch {
      flashMessage('error', 'Invalid code - could not import.')
    }
  }

  return (
    <div>
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 12 }}>
          <span className="pill">{ownedCount} cards owned</span>
          <button type="button" className="btn btn-sm" onClick={handleExportCode}>Copy export code</button>
          <button type="button" className="btn btn-sm" onClick={handleDownload}>Download JSON</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowImport((v) => !v)}>
            {showImport ? 'Cancel import' : 'Import code'}
          </button>
          {message && (
            <span className="field-hint" style={{ color: message.type === 'error' ? 'var(--red)' : 'var(--green)' }}>
              {message.text}
            </span>
          )}
        </div>

        {exportCode && !showImport && (
          <textarea readOnly value={exportCode} rows={3} style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.72rem' }} />
        )}

        {showImport && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <textarea
              value={importValue}
              onChange={(e) => setImportValue(e.target.value)}
              rows={3}
              placeholder="Paste an export code or JSON collection here"
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.72rem' }}
            />
            <div>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleImport} disabled={!importValue.trim()}>
                Load collection
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <div className="scb-config-grid" style={{ marginBottom: 0 }}>
          <div className="field">
            <label>Type</label>
            <div className="toggle-pill-row">
              {['All', ...TYPE_ORDER].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`toggle-pill ${typeFilter === t ? 'active' : ''}`}
                  onClick={() => setTypeFilter(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label>Rarity</label>
            <div className="toggle-pill-row">
              {['All', 'SSR', 'SR', 'R'].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`toggle-pill ${rarityFilter === r ? 'active' : ''}`}
                  onClick={() => setRarityFilter(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="field">
            <label htmlFor="scb-collection-search">Search</label>
            <input
              id="scb-collection-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Card name..."
            />
          </div>
        </div>
      </div>

      {filteredCards.length === 0 ? (
        <p className="empty-state">No cards found matching your filters.</p>
      ) : (
        <div className="scb-collection-grid">
          {filteredCards.map((c) => {
            const owned = ownedCards[c.id]
            const level = owned === undefined ? -1 : owned
            return (
              <div key={c.id} className={`scb-collection-card ${level === -1 ? 'scb-collection-card-unowned' : ''}`}>
                <SupportCardArt cardId={c.id} name={c.card_chara_name} width={80} />
                <div className="scb-tier-card-name">{c.card_chara_name}</div>
                <span className="pill">{RARITY_SYMBOL[c.rarity] || '?'}</span>
                <select value={level} onChange={(e) => setOwnership(c.id, parseInt(e.target.value, 10))}>
                  {Object.entries(OWNERSHIP_LABELS).map(([lvl, label]) => (
                    <option key={lvl} value={lvl}>{label}</option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
