import type { Lantern } from "@/types/lantern"

/**
 * Recency -> perspective.
 *
 * Newer messages read as closer to the viewer: substantially larger and more
 * present, while older ones recede into the distance.
 *
 * Recomputed whenever lantern data changes, so depth stays relative to the
 * newest message in the set.
 */

export type LanternDepth = {
  /** 0 = oldest in the set (far), 1 = newest (near). */
  depth: number
  scale: number
  opacity: number
  blur: number
  zIndex: number
}

const SCALE = { far: 0.6, near: 1.8 }
const OPACITY = { far: 0.68, near: 1 }
const BLUR = { far: 1.1, near: 0 }

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * The depth a freshly released lantern will have once it joins the field: it
 * is always the newest message, so it always lands at the near end.
 *
 * The release animation renders with this so the lantern in flight is exactly
 * the size, opacity and blur of the lantern that replaces it on landing —
 * without it, the two disagree and the lantern visibly resizes as it settles.
 */
export const NEAR_DEPTH: LanternDepth = {
  depth: 1,
  scale: SCALE.near,
  opacity: OPACITY.near,
  blur: BLUR.near,
  zIndex: 50,
}

export function computeDepths(lanterns: Lantern[]): Record<string, LanternDepth> {
  if (lanterns.length === 0) return {}

  const times = lanterns.map((lantern) => new Date(lantern.createdAt).getTime())
  const validTimes = times.filter(Number.isFinite)
  const oldest = Math.min(...validTimes)
  const newest = Math.max(...validTimes)
  const span = newest - oldest

  const result: Record<string, LanternDepth> = {}

  lanterns.forEach((lantern, index) => {
    const time = times[index]
    // Chronological depth is intentionally direct and unambiguous:
    // oldest timestamp = 0 (back), newest timestamp = 1 (front).
    const depth = Number.isFinite(time) ? (span === 0 ? 1 : (time - oldest) / span) : 0

    result[lantern.id] = {
      depth,
      scale: Number(lerp(SCALE.far, SCALE.near, depth).toFixed(3)),
      opacity: Number(lerp(OPACITY.far, OPACITY.near, depth).toFixed(3)),
      blur: Number(lerp(BLUR.far, BLUR.near, depth).toFixed(2)),
      zIndex: 10 + Math.round(depth * 40),
    }
  })

  return result
}
