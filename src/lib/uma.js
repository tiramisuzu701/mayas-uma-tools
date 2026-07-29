import { CUSTOM_CHARACTER_ID, findCharacter } from '../data/characters.js'

export function blankUma() {
  return {
    characterId: '',
    customName: '',
    nickname: '',
    stats: { speed: '', stamina: '', power: '', guts: '', wit: '' },
    aptitudes: {
      track: { turf: 'G', dirt: 'G' },
      distance: { short: 'G', mile: 'G', medium: 'G', long: 'G' },
      style: { front: 'G', pace: 'G', late: 'G', end: 'G' },
    },
    runningStyle: 'front',
    uniqueSkill: '',
    notes: '',
  }
}

export function characterName(uma) {
  if (!uma) return ''
  if (uma.characterId === CUSTOM_CHARACTER_ID) return uma.customName || 'Unnamed custom uma'
  return findCharacter(uma.characterId)?.name || uma.customName || 'Unknown'
}

export function displayName(uma) {
  const base = characterName(uma)
  return uma.nickname ? `${base} (${uma.nickname})` : base
}
