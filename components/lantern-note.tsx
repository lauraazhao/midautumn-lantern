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
  /** Small print along the bottom of the lantern body. */
  footer: ReactNode
}

/**
 * A single lantern seen up close, with the message written on its paper.
 *
 * The shape is built from three parts — top ring, glowing paper body, bottom
 * hoop with the flame beneath it — so the message sits directly on the same
 * surface that glows. It keeps drifting gently, as if you floated up next to it.
 *
 * ── ASSET SWAP POINT ──
 * The body is a flat category color + `ASSETS.paperTexture` overlay, shaded to
 * read as a lit cylinder. To use real lantern artwork, replace the background
 * layers on the body below; the content slots stay exactly the same.
 */
export function LanternNote({ paper, ink, accent, message, footer }: LanternNoteProps) {
  const floatVars = {
    "--float-duration": "11s",
    "--float-delay": "0s",
    "--drift-x": "3px",
    "--drift-y": "-9px",
  } as CSSProperties

  return (
    <div className="animate-lantern-float w-[min(78vw,19rem)]" style={floatVars}>
      <div className="relative duration-700 animate-in fade-in zoom-in-90">
        {/* Halo — the lantern lights the air around it. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[28%] rounded-full opacity-70 blur-[10px]"
          style={{
            background: `radial-gradient(circle at 50% 58%, color-mix(in oklab, var(--glow) 55%, ${accent}) 0%, transparent 66%)`,
          }}
        />

        {/* Top ring — where the paper gathers. */}
        <div
          aria-hidden="true"
          className="relative mx-auto h-2.5 w-[54%] rounded-full"
          style={{
            background: "linear-gradient(to bottom, #7a5732 0%, #3a2413 60%, #24160b 100%)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.18) inset, 0 6px 14px -6px rgba(0,0,0,0.8)",
          }}
        />

        {/* Body — lit paper, and the writing on it. */}
        <div
          className="relative -mt-1 flex min-h-[23rem] flex-col sm:min-h-[25rem]"
          style={{
            color: ink,
            backgroundColor: paper,
            backgroundImage: [
              `url(${ASSETS.paperTexture})`,
              // Flame light pooling up from the bottom.
              "radial-gradient(130% 78% at 50% 104%, rgba(255,203,130,0.62) 0%, rgba(255,203,130,0.18) 38%, transparent 66%)",
              // Cylinder shading — dark at the edges, bright down the middle.
              "linear-gradient(to right, rgba(46,24,8,0.30) 0%, rgba(46,24,8,0.08) 14%, rgba(255,255,255,0.14) 50%, rgba(46,24,8,0.08) 86%, rgba(46,24,8,0.30) 100%)",
            ].join(","),
            backgroundSize: "100% 100%, 100% 100%, 100% 100%",
            borderRadius: "46% 46% 42% 42% / 13% 13% 11% 11%",
            boxShadow:
              "inset 0 -22px 46px -14px rgba(255,190,110,0.5), inset 0 14px 30px -16px rgba(46,24,8,0.35), 0 34px 80px -28px rgba(0,0,0,0.85)",
          }}
        >
          {/* Paper seams down the lantern. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              borderRadius: "inherit",
              backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent calc(25% - 1px), ${ink}14 calc(25% - 1px), ${ink}14 25%)`,
            }}
          />

          <div className="relative flex flex-1 flex-col gap-5 px-8 py-12 text-center sm:px-10">
            <div className="grid flex-1 place-items-center">{message}</div>
            {footer}
          </div>
        </div>

        {/* Bottom hoop, then the flame burning below it. */}
        <div
          aria-hidden="true"
          className="relative z-10 mx-auto -mt-1.5 h-2 w-[46%] rounded-full"
          style={{
            background: "linear-gradient(to bottom, #6d4c2b 0%, #2c1b0f 100%)",
            boxShadow: "0 6px 16px -6px rgba(0,0,0,0.85)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none relative mx-auto -mt-2 size-8 rounded-full opacity-90 blur-[5px]"
          style={{
            background: "radial-gradient(circle, var(--glow) 0%, rgba(255,150,60,0.45) 45%, transparent 72%)",
          }}
        />
      </div>
    </div>
  )
}
