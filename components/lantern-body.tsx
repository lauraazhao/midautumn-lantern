import type { CSSProperties } from "react"
import type { LanternDepth } from "@/lib/lantern-depth"
import { LanternArt } from "@/components/scene-art"

type LanternBodyProps = {
  depth: LanternDepth
  rotation: number
  /** Category accent used by the message-tagging preview. */
  glowColor: string
}

/**
 * The lantern artwork at rest: size, lean, depth fading and glow.
 *
 * Shared by the lanterns in the field and by the one in flight after a
 * release, so a landing lantern is pixel-identical to the one that replaces
 * it. Sizing is driven by `--lantern-base` from the nearest ancestor that
 * defines it, so both callers must provide the same value.
 */
export function LanternBody({ depth, rotation, glowColor }: LanternBodyProps) {
  const glow = `color-mix(in oklab, var(--glow) 55%, ${glowColor})`

  return (
    <span
      className="lantern-depth-transition relative block group-hover:opacity-100 group-focus-visible:opacity-100"
      style={
        {
          "--lantern-glow": glow,
          "--lantern-glow-rest": `color-mix(in oklab, ${glow} 25%, transparent)`,
          "--lantern-glow-hover": `color-mix(in oklab, ${glow} 55%, transparent)`,
          "--lantern-glow-focus": `color-mix(in oklab, ${glow} 60%, transparent)`,
          width: `calc(var(--lantern-base) * ${depth.scale})`,
          height: `calc(var(--lantern-base) * ${depth.scale} * 1.5)`,
          transform: `rotate(${rotation}deg)`,
          opacity: depth.opacity,
          filter: depth.blur ? `blur(${depth.blur}px)` : undefined,
        } as CSSProperties
      }
    >
      {/* Glow — soft on rest, stronger on hover/keyboard focus. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-[45%] rounded-full opacity-35 blur-[6px] transition-opacity duration-500 ease-out group-hover:opacity-80 group-focus-visible:opacity-90"
        style={{ background: "radial-gradient(circle at 50% 55%, var(--lantern-glow) 0%, transparent 68%)" }}
      />
      <span className="relative block h-full w-full drop-shadow-[0_0_10px_var(--lantern-glow-rest)] transition-[filter] duration-500 group-hover:drop-shadow-[0_0_18px_var(--lantern-glow-hover)] group-focus-visible:drop-shadow-[0_0_18px_var(--lantern-glow-focus)]">
        <LanternArt />
      </span>
    </span>
  )
}

/** Responsive field scale. Both the field and the flight layer need this. */
export const LANTERN_BASE = "[--lantern-base:40px] sm:[--lantern-base:50px] lg:[--lantern-base:60px]"
