"use client"

import type { CSSProperties } from "react"
import type { Lantern as LanternType } from "@/types/lantern"
import type { LanternDepth } from "@/lib/lantern-depth"
import { Lantern } from "@/components/lantern"
import { LANTERN_BASE } from "@/components/lantern-body"

type LanternFieldProps = {
  lanterns: LanternType[]
  depths: Record<string, LanternDepth>
  onOpen: (lantern: LanternType, trigger: HTMLElement) => void
  /** Lanterns that arrived by release, which start their drift at rest. */
  landedIds?: ReadonlySet<string>
}

const FALLBACK: LanternDepth = { depth: 0.5, scale: 0.85, opacity: 0.85, blur: 0.4, zIndex: 20 }

/**
 * The clickable layer of the sky. Positions come from the lantern records and
 * sizes come from the depth calculation — this component only lays them out.
 * `--lantern-base` scales the whole field responsively.
 */
export function LanternField({ lanterns, depths, onOpen, landedIds }: LanternFieldProps) {
  return (
    <div className={`absolute inset-0 z-10 ${LANTERN_BASE}`} style={{ contain: "layout paint" } as CSSProperties}>
      {lanterns.map((lantern) => (
        <Lantern
          key={lantern.id}
          lantern={lantern}
          depth={depths[lantern.id] ?? FALLBACK}
          onOpen={onOpen}
          smoothFloat={landedIds?.has(lantern.id)}
        />
      ))}
    </div>
  )
}
