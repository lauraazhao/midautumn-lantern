/**
 * Placement math for the sky.
 *
 * Positions are percentages of the viewport so the scene stays responsive.
 * Everything here is deterministic (seeded) so lanterns never jump around
 * between rerenders — a lantern's position lives with its record.
 */

const BOUNDS = {
  minX: 6,
  maxX: 94,
  minY: 8,
  /** Leaves breathing room above the bottom edge / controls. */
  maxY: 84,
}

/** Keep-clear zone for the bottom-center "Release a lantern" control. */
const RELEASE_ZONE = { minX: 36, maxX: 64, minY: 72 }

/** Keep-clear zone for the title, top-left. */
const TITLE_ZONE = { maxX: 26, maxY: 14 }

/** Keep-clear zone for the moon, top-right. */
const MOON_ZONE = { minX: 78, maxY: 24 }

/** Where the lanterns appear to be drifting toward. */
export const DRIFT_TARGET = { x: 50, y: 12 }

/** Minimum distance (in percentage units) between two lanterns. */
const MIN_DISTANCE = 11

/** Deterministic PRNG so a given seed always yields the same sky. */
export function createRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashString(value: string) {
  let hash = 2166136261
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** Areas reserved for the UI and the moon. */
function isBlocked(x: number, y: number) {
  if (x > RELEASE_ZONE.minX && x < RELEASE_ZONE.maxX && y > RELEASE_ZONE.minY) return true
  if (x < TITLE_ZONE.maxX && y < TITLE_ZONE.maxY) return true
  if (x > MOON_ZONE.minX && y < MOON_ZONE.maxY) return true
  return false
}

function tooClose(x: number, y: number, taken: Array<{ x: number; y: number }>) {
  return taken.some((p) => Math.hypot(p.x - x, p.y - y) < MIN_DISTANCE)
}

/**
 * Rotation with an overall tendency toward the top-center of the sky:
 * lanterns on the left lean right, lanterns on the right lean left, and each
 * one gets a small individual offset so the group never looks aligned.
 */
export function rotationTowardDrift(x: number, random: () => number) {
  const lean = (DRIFT_TARGET.x - x) * 0.22
  const jitter = (random() - 0.5) * 12
  return Math.round((lean + jitter) * 10) / 10
}

/**
 * Scatters `count` lanterns across the sky, avoiding the edges, the release
 * control, and excessive overlap. Uses rejection sampling with a fallback so
 * it always terminates.
 */
export function scatterPositions(count: number, seed = 20260926) {
  const random = createRandom(seed)
  const placed: Array<{ x: number; y: number; rotation: number }> = []

  for (let i = 0; i < count; i++) {
    let x = 0
    let y = 0
    for (let attempt = 0; attempt < 60; attempt++) {
      x = BOUNDS.minX + random() * (BOUNDS.maxX - BOUNDS.minX)
      y = BOUNDS.minY + random() * (BOUNDS.maxY - BOUNDS.minY)
      if (!isBlocked(x, y) && !tooClose(x, y, placed)) break
    }
    placed.push({
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      rotation: rotationTowardDrift(x, random),
    })
  }

  return placed
}

/** A single safe slot for a freshly released lantern. */
export function randomPlacement(existing: Array<{ x: number; y: number }>, seed = Date.now()) {
  const random = createRandom(seed)
  let x = 50
  let y = 40

  for (let attempt = 0; attempt < 80; attempt++) {
    x = BOUNDS.minX + random() * (BOUNDS.maxX - BOUNDS.minX)
    // Bias new lanterns toward the upper half so they read as "closest".
    y = BOUNDS.minY + random() * (BOUNDS.maxY - BOUNDS.minY) * 0.75
    if (!isBlocked(x, y) && !tooClose(x, y, existing)) break
  }

  return {
    x: Math.round(x * 10) / 10,
    y: Math.round(y * 10) / 10,
    rotation: rotationTowardDrift(x, random),
  }
}

/** Origin of the release animation — directly above the bottom-center button. */
export const RELEASE_ORIGIN = { x: 50, y: 94 }
