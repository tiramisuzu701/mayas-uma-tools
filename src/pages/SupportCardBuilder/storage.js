// Persistence for the Support Card Builder's Phase 2 features - your owned
// card collection and equipped blue sparks. Same pattern as
// src/lib/storage.js (Team Trials' roster persistence): plain
// localStorage-backed JSON blobs, one key per concern, nothing sent
// anywhere.

const OWNED_CARDS_KEY = 'mut.supportCards.owned.v1'
const SPARKS_KEY = 'mut.supportCards.sparks.v1'

function readJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch (err) {
    console.warn(`Failed to read "${key}" from localStorage, using fallback.`, err)
    return fallback
  }
}

function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (err) {
    console.error(`Failed to write "${key}" to localStorage.`, err)
    return false
  }
}

// --- Owned card collection ---------------------------------------------
// A plain { [cardId]: limitBreak } map - presence of a key means "owned",
// the value (0-4) is the limit break level you own it at. Only one limit
// break per card is tracked at a time (matches Tachyon's Lab's own model).

export function loadOwnedCards() {
  return readJSON(OWNED_CARDS_KEY, {})
}

export function saveOwnedCards(ownedCards) {
  return writeJSON(OWNED_CARDS_KEY, ownedCards)
}

function sanitizeOwnedCards(raw) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error('Not a collection object.')
  }
  const clean = {}
  for (const [key, value] of Object.entries(raw)) {
    const id = Number(key)
    const lb = Number(value)
    if (Number.isInteger(id) && [0, 1, 2, 3, 4].includes(lb)) {
      clean[id] = lb
    }
  }
  return clean
}

// Unicode-safe base64 encode/decode (a plain JSON.stringify wouldn't
// round-trip through btoa/atob if a card name ever had non-Latin1
// characters, so this goes through TextEncoder/TextDecoder first).
export function exportOwnedCardsCode(ownedCards) {
  const payload = { kind: 'mayas-uma-tools.support-card-collection', version: 1, ownedCards }
  const bytes = new TextEncoder().encode(JSON.stringify(payload))
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return btoa(binary)
}

// Accepts either a code produced by exportOwnedCardsCode, a raw pasted
// JSON object (either the versioned { kind, ownedCards } shape or a bare
// { [id]: limitBreak } map), and sanitizes/validates entries either way.
// Throws on anything that doesn't look like a collection - callers should
// catch and show a friendly error rather than half-importing garbage.
export function importOwnedCardsCode(code) {
  const trimmed = code.trim()
  let parsed
  if (trimmed.startsWith('{')) {
    parsed = JSON.parse(trimmed)
  } else {
    const binary = atob(trimmed)
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    parsed = JSON.parse(new TextDecoder().decode(bytes))
  }
  const ownedCards = parsed && typeof parsed === 'object' && parsed.ownedCards ? parsed.ownedCards : parsed
  return sanitizeOwnedCards(ownedCards)
}

export function downloadOwnedCardsFile(ownedCards) {
  const payload = {
    kind: 'mayas-uma-tools.support-card-collection',
    version: 1,
    exportedAt: new Date().toISOString(),
    ownedCards,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `uma-support-card-collection-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// --- Blue sparks ---------------------------------------------------------
// Fixed-length array of { stat, star } slots (both nullable = empty slot).

export function loadSparks(maxSparks) {
  const saved = readJSON(SPARKS_KEY, null)
  const base = Array.isArray(saved) ? saved : []
  return Array.from({ length: maxSparks }, (_, i) => base[i] ?? { stat: null, star: null })
}

export function saveSparks(sparks) {
  return writeJSON(SPARKS_KEY, sparks)
}
