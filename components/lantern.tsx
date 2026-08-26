"use client"

import type { CSSProperties, MouseEvent } from "react"
import type { Lantern as LanternType } from "@/types/lantern"
import type { LanternDepth } from "@/lib/lantern-depth"
import { hashString, createRandom } from "@/lib/lantern-positioning"
import { relativeTime } from "@/lib/format-time"
import { LanternBody } from "@/components/lantern-body"

type LanternProps = {
  lantern: LanternType
  depth: LanternDepth
  onOpen: (lantern: LanternType, trigger: HTMLElement) => void
  /**
   * Starts the drift at rest (phase zero) instead of mid-cycle. Used for a
   * lantern that just landed from a release: a negative delay would snap it
   * several pixels away the instant it appears.
   */
  smoothFloat?: boolean
}

/** Per-lantern drift so no two float on exactly the same rhythm. */
function floatVars(id: string, smooth: boolean): CSSProperties {
  const random = createRandom(hashString(id))
  const duration = `${(7 + random() * 6).toFixed(2)}s`
  const delay = `-${(random() * 8).toFixed(2)}s`
  return {
    "--float-duration": duration,
    "--float-delay": smooth ? "0s" : delay,
    "--drift-x": `${(random() * 8 - 4).toFixed(1)}px`,
    "--drift-y": `${(-6 - random() * 9).toFixed(1)}px`,
  } as CSSProperties
}

export function Lantern({ lantern, depth, onOpen, smoothFloat = false }: LanternProps) {
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
      className="group absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-0 outline-none focus:outline-none focus-visible:outline-none"
      style={{
        left: `${lantern.x}%`,
        top: `${lantern.y}%`,
        width: hitSize,
        height: hitSize,
        zIndex: depth.zIndex,
      }}
    >
      <span className="animate-lantern-float block" style={floatVars(lantern.id, smoothFloat)}>
        <LanternBody depth={depth} rotation={lantern.rotation} />
      </span>
    </button>
  )
}
