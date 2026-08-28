"use client"

import { useCallback, useEffect, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { disable, enable } from "@/lib/audio-engine"
import { MoonArt } from "@/components/scene-art"

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
      className="moon-sound-toggle group absolute top-[6%] left-[8%] z-[70] h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20"
    >
      <span aria-hidden="true" className="moon-sound-toggle__halo" />
      <span aria-hidden="true" className="moon-sound-toggle__art animate-moon-breathe">
        <MoonArt />
      </span>
      <span aria-hidden="true" className="moon-sound-toggle__status">
        {on ? <Volume2 strokeWidth={2} /> : <VolumeX strokeWidth={2} />}
      </span>

      {/* A faint ring hints that the dim moon can be clicked to enable sound. */}
      {!on && (
        <span
          aria-hidden="true"
          className="moon-sound-toggle__hint animate-sound-hint pointer-events-none absolute -inset-[18%]"
        />
      )}
    </button>
  )
}
