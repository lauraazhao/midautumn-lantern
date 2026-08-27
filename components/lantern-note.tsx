"use client"

import type { CSSProperties, ReactNode } from "react"
import { ASSETS } from "@/components/scene-art"

type LanternNoteProps = {
  /** Paper surface color — comes from the message category. */
  paper: string
  ink: string
  /** Saturated category color, used for the glow and the written tag. */
  accent: string
  /** The message, written on the lantern's paper. */
  message: ReactNode
  /** Optional small print along the bottom of the lantern body. */
  footer?: ReactNode
}

/** Shared type scale so composing and reading the same message look identical. */
export function lanternMessageTextSize(length: number) {
  if (length > 150) return "text-xs leading-relaxed sm:text-sm"
  if (length > 90) return "text-sm leading-relaxed sm:text-base"
  return "text-xl leading-relaxed sm:text-2xl"
}

/**
 * A single lantern seen up close, with the message written on its paper.
 *
 * The shape is built from three parts — top ring, glowing paper body, bottom
 * hoop with the flame beneath it — so the message sits directly on the same
 * surface that glows. It keeps drifting gently, as if you floated up next to it.
 *
 * The uploaded lantern artwork sits behind the content slots. It is zoomed
 * slightly so the paper body fills this close-up view.
 */
export function LanternNote({ paper, ink, accent, message, footer }: LanternNoteProps) {
  const floatVars = {
    "--float-duration": "11s",
    "--float-delay": "0s",
    "--drift-x": "3px",
    "--drift-y": "-9px",
  } as CSSProperties

  return (
    <div className="animate-lantern-float h-[min(50dvh,30rem)] max-w-[82vw] aspect-[2/3]" style={floatVars}>
      <div className="relative h-full w-full duration-700 animate-in fade-in zoom-in-90">
        {/* Ambient light behind the uploaded artwork. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[28%] rounded-full opacity-70 blur-[10px]"
          style={{
            background: `radial-gradient(circle at 50% 58%, color-mix(in oklab, var(--glow) 55%, ${accent}) 0%, transparent 66%)`,
          }}
        />

        <img
          src={ASSETS.lantern}
          alt=""
          aria-hidden="true"
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
          style={{ transform: "translate(0.7rem, 1rem) scale(1.65)" }}
        />

        <div
          className="absolute inset-[16%_10%_16%] flex flex-col gap-3 px-4 py-4 text-center sm:px-6 sm:py-5"
          style={{ color: ink }}
        >
          <div className="flex min-h-0 w-full max-w-full flex-1 flex-col items-center justify-center gap-2">
            {message}
          </div>
          {footer}
        </div>
      </div>
    </div>
  )
}
