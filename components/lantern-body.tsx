import type { LanternDepth } from "@/lib/lantern-depth"
import { LanternArt } from "@/components/scene-art"

type LanternBodyProps = {
  depth: LanternDepth
  rotation: number
}

/**
 * The lantern artwork at rest: size, lean, depth fading and glow.
 *
 * Shared by the lanterns in the field and by the one in flight after a
 * release, so a landing lantern is pixel-identical to the one that replaces
 * it. Sizing is driven by `--lantern-base` from the nearest ancestor that
 * defines it, so both callers must provide the same value.
 */
export function LanternBody({ depth, rotation }: LanternBodyProps) {
  return (
    <span
      className="relative block transition-[filter,opacity] duration-500 ease-out group-hover:opacity-100 group-focus-visible:opacity-100"
      style={{
        width: `calc(var(--lantern-base) * ${depth.scale})`,
        height: `calc(var(--lantern-base) * ${depth.scale} * 1.5)`,
        transform: `rotate(${rotation}deg)`,
        opacity: depth.opacity,
        filter: depth.blur ? `blur(${depth.blur}px)` : undefined,
      }}
    >
      {/* Glow — soft on rest, stronger on hover/keyboard focus. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[45%] rounded-full opacity-35 blur-[6px] transition-opacity duration-500 ease-out group-hover:opacity-80 group-focus-visible:opacity-90"
        style={{ background: "radial-gradient(circle at 50% 55%, var(--glow) 0%, transparent 68%)" }}
      />
      <span className="relative block h-full w-full drop-shadow-[0_0_10px_rgba(255,207,138,0.25)] transition-[filter] duration-500 group-hover:drop-shadow-[0_0_18px_rgba(255,207,138,0.55)] group-focus-visible:drop-shadow-[0_0_18px_rgba(255,207,138,0.6)]">
        <LanternArt />
      </span>
    </span>
  )
}

/** Responsive field scale. Both the field and the flight layer need this. */
export const LANTERN_BASE = "[--lantern-base:32px] sm:[--lantern-base:40px] lg:[--lantern-base:48px]"
