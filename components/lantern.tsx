"use client"

import type { CSSProperties, MouseEvent } from "react"
import type { Lantern as LanternType } from "@/types/lantern"
import type { LanternDepth } from "@/lib/lantern-depth"
import { hashString, createRandom } from "@/lib/lantern-positioning"
import { relativeTime } from "@/lib/format-time"
import { LanternArt } from "@/components/scene-art"

type LanternProps = {
  lantern: LanternType
  depth: LanternDepth
  onOpen: (lantern: LanternType, trigger: HTMLElement) => void
}

/** Per-lantern drift so no two float on exactly the same rhythm. */
function floatVars(id: string): CSSProperties {
  const random = createRandom(hashString(id))
  return {
    "--float-duration": `${(7 + random() * 6).toFixed(2)}s`,
    "--float-delay": `-${(random() * 8).toFixed(2)}s`,
    "--drift-x": `${(random() * 8 - 4).toFixed(1)}px`,
    "--drift-y": `${(-6 - random() * 9).toFixed(1)}px`,
  } as CSSProperties
}

export function Lantern({ lantern, depth, onOpen }: LanternProps) {
  const artWidth = `calc(var(--lantern-base) * ${depth.scale})`
  const artHeight = `calc(var(--lantern-base) * ${depth.scale} * 1.5)`
  // Generous tap target: never smaller than 56px, even for distant lanterns.
  const hitSize = `max(56px, calc(${artHeight} + 0.75rem))`

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onOpen(lantern, event.currentTarget)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Read the lantern released ${relativeTime(lantern.createdAt)}`}
      className="group absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full focus:outline-none"
      style={{
        left: `${lantern.x}%`,
        top: `${lantern.y}%`,
        width: hitSize,
        height: hitSize,
        zIndex: depth.zIndex,
      }}
    >
      <span className="animate-lantern-float block" style={floatVars(lantern.id)}>
        <span
          className="relative block transition-[filter,opacity] duration-500 ease-out group-hover:opacity-100 group-focus-visible:opacity-100"
          style={{
            width: artWidth,
            height: artHeight,
            transform: `rotate(${lantern.rotation}deg)`,
            opacity: depth.opacity,
            filter: depth.blur ? `blur(${depth.blur}px)` : undefined,
          }}
        >
          {/* Glow — soft on rest, stronger on hover/keyboard focus. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-[45%] rounded-full opacity-35 blur-[6px] transition-opacity duration-500 ease-out group-hover:opacity-80 group-focus-visible:opacity-90"
            style={{
              background: "radial-gradient(circle at 50% 55%, var(--glow) 0%, transparent 68%)",
            }}
          />
          <span className="relative block h-full w-full drop-shadow-[0_0_10px_rgba(255,207,138,0.25)] transition-[filter] duration-500 group-hover:drop-shadow-[0_0_18px_rgba(255,207,138,0.55)] group-focus-visible:drop-shadow-[0_0_18px_rgba(255,207,138,0.6)]">
            <LanternArt />
          </span>
        </span>
      </span>
    </button>
  )
}
