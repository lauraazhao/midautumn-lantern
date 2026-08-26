"use client"

import { useCallback, useEffect, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { disable, enable } from "@/lib/audio-engine"

/**
 * Audio is off until the visitor asks for it — browsers block autoplay, and a
 * night sky that starts humming unannounced is worse than one that waits.
 */
export function SoundToggle() {
  const [on, setOn] = useState(false)

  const toggle = useCallback(() => {
    if (on) {
      disable()
      setOn(false)
      return
    }
    // Only flips if the browser actually gave us an audio context.
    setOn(enable())
  }, [on])

  // Never leave the ambient bed running behind an unmounted scene.
  useEffect(() => () => disable(), [])

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Turn sound off" : "Turn sound on"}
      className="group absolute top-5 left-5 z-[70] flex items-center gap-2 rounded-full border border-foreground/15 bg-foreground/10 px-3 py-2 text-foreground/70 backdrop-blur-md transition-colors hover:border-glow/40 hover:bg-foreground/15 hover:text-glow focus-visible:ring-2 focus-visible:ring-glow/70 focus-visible:outline-none sm:top-6 sm:left-6"
    >
      {on ? (
        <Volume2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
      ) : (
        <VolumeX aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
      )}
      <span className="text-[0.7rem] tracking-[0.18em] uppercase">Sound</span>

      {/* A soft breathing ring while sound is off, so the control is noticed. */}
      {!on && (
        <span
          aria-hidden="true"
          className="animate-sound-hint pointer-events-none absolute inset-0 rounded-full border border-glow/40"
        />
      )}
    </button>
  )
}
