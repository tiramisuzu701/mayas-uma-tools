// All persistence for the Team Trials Builder lives in the browser via
// localStorage - there is no server/database. Everything here is plain
// synchronous read/modify/write of a single JSON blob per storage key,
// which is plenty for roster sizes a person would realistically manage by
// hand (tens of entries, not thousands).

const ROSTER_KEY = 'mut.teamTrials.roster.v1'

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

export function loadRoster() {
  return readJSON(ROSTER_KEY, [])
}

export function saveRoster(roster) {
  return writeJSON(ROSTER_KEY, roster)
}

export function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

// --- Backup / restore -------------------------------------------------
// Because everything lives only in this browser, it's easy to lose a
// roster (clearing site data, switching browsers/devices). Export produces
// a plain JSON file the user can save anywhere; import reads one back in.

export function exportRosterAsFile(roster) {
  const payload = {
    kind: 'mayas-uma-tools.team-trials-roster',
    version: 1,
    exportedAt: new Date().toISOString(),
    roster,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `uma-team-trials-roster-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function parseImportedRosterFile(fileText) {
  const data = JSON.parse(fileText)
  const roster = Array.isArray(data) ? data : data?.roster
  if (!Array.isArray(roster)) {
    throw new Error('This file does not look like a Team Trials roster export.')
  }
  return roster
}
