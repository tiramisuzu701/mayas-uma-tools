// Optimal (not just greedy) assignment of roster entries to race slots,
// maximizing total fit score, with each roster entry usable in at most one
// slot. Solved with the standard "assignment problem via bitmask DP over
// slots" technique: since there are only 5 slots, there are only 2^5 = 32
// possible subsets of "slots filled so far", so we can afford an exact
// solution instead of a greedy heuristic that might miss a better overall
// combination.
//
// scoreFn(candidate, slot) must return a non-negative number.
export function computeOptimalAssignment(candidates, slots, scoreFn) {
  const slotCount = slots.length
  const fullMask = (1 << slotCount) - 1

  // dp[mask] = best total score achievable using some subset of the
  // candidates considered so far to exactly fill the slots in `mask`.
  let dp = new Array(fullMask + 1).fill(0)

  // history[i] records, per mask, which slot (if any) candidate i was used
  // for to reach that mask's dp value - used to backtrack the assignment.
  const history = []

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i]
    const prevDp = dp
    const nextDp = prevDp.slice()
    const choice = new Array(fullMask + 1).fill(-1)

    for (let mask = 0; mask <= fullMask; mask++) {
      for (let s = 0; s < slotCount; s++) {
        const bit = 1 << s
        if (mask & bit) continue // slot s already filled in this mask
        const prevMask = mask
        const candidateScore = scoreFn(candidate, slots[s])
        const withCandidate = prevDp[prevMask] + candidateScore
        const newMask = mask | bit
        if (withCandidate > nextDp[newMask]) {
          nextDp[newMask] = withCandidate
          choice[newMask] = s
        }
      }
    }

    history.push(choice)
    dp = nextDp
  }

  // Backtrack from the full mask (using every slot) to reconstruct which
  // candidate landed in which slot.
  const assignment = new Array(slotCount).fill(null)
  let mask = fullMask
  for (let i = candidates.length - 1; i >= 0; i--) {
    const choice = history[i]
    const s = choice[mask]
    if (s !== -1 && s !== undefined) {
      assignment[s] = candidates[i]
      mask = mask & ~(1 << s)
    }
  }

  return {
    assignment, // array aligned with `slots`, entries are candidates or null
    total: dp[fullMask],
  }
}
