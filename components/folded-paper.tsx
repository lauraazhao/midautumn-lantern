"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { ASSETS } from "@/components/scene-art"

type FoldedPaperProps = {
  /** Paper surface color — comes from the message category. */
  paper: string
  ink: string
  /** Content printed on the inside upper half (revealed by the unfold). */
  inside: ReactNode
  /** Content on the lower half (visible while still folded). */
  footer: ReactNode
}

/**
 * A note folded in half that unfolds along its crease.
 *
 * The upper half is a flap rotating on its bottom edge: at rest it lies face
 * down over the lower half (you see blank paper), then it swings up to reveal
 * the message. With reduced motion it simply starts open.
 *
 * ── ASSET SWAP POINT ──
 * The paper is a flat color + `ASSETS.paperTexture` overlay. To use real
 * folded-paper artwork, replace the two background layers below; the unfold
 * geometry and content slots stay exactly the same.
 */
export function FoldedPaper({ paper, ink, inside, footer }: FoldedPaperProps) {
  const reducedMotion = useReducedMotion()
  const [unfolded, setUnfolded] = useState(false)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    if (reducedMotion) {
      setUnfolded(true)
      return
    }
    frame.current = requestAnimationFrame(() => setUnfolded(true))
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current)
    }
  }, [reducedMotion])

  const surface = {
    backgroundColor: paper,
    backgroundImage: `url(${ASSETS.paperTexture})`,
    backgroundSize: "100% 100%",
    color: ink,
  }

  return (
    <div className="w-[min(92vw,30rem)]" style={{ perspective: "1600px" }}>
      <div className="relative" style={{ transformStyle: "preserve-3d" }}>
        {/* Upper half — the flap that unfolds */}
        <div
          className="relative origin-bottom rounded-t-[10px] shadow-[0_18px_40px_-18px_rgba(0,0,0,0.65)] transition-transform duration-[850ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
          style={{
            ...surface,
            transform: unfolded ? "rotateX(0deg)" : "rotateX(-176deg)",
            transformStyle: "preserve-3d",
            // Keep the flap above the lower half while it is folded over it.
            zIndex: 2,
          }}
        >
          <div
            className="flex min-h-44 flex-col justify-center gap-4 px-6 py-8 sm:min-h-52 sm:px-8"
            style={{ backfaceVisibility: "hidden" }}
          >
            {inside}
          </div>
        </div>

        {/* Crease */}
        <div aria-hidden="true" className="h-px w-full bg-black/15" />

        {/* Lower half — visible even while folded */}
        <div
          className="flex min-h-44 flex-col justify-end gap-4 rounded-b-[10px] px-6 py-6 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)] sm:min-h-52 sm:px-8"
          style={surface}
        >
          {footer}
        </div>
      </div>
    </div>
  )
}
