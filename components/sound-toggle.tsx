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
      className="sound-trigger group absolute top-5 left-5 z-[70] sm:top-6 sm:left-6"
    >
      {on ? (
        <Volume2 aria-hidden="true" className="sound-trigger__icon" strokeWidth={1.5} />
      ) : (
        <VolumeX aria-hidden="true" className="sound-trigger__icon" strokeWidth={1.5} />
      )}
      <span className="sound-trigger__label font-serif uppercase">Sound</span>

      {/* A soft breathing ring while sound is off, so the control is noticed. */}
      {!on && (
        <span
          aria-hidden="true"
          className="sound-trigger__hint animate-sound-hint pointer-events-none absolute inset-0"
        />
      )}
    </button>
  )
}
