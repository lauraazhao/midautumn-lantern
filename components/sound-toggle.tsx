"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { disable, enable } from "@/lib/audio-engine"
import { MoonArt } from "@/components/scene-art"

/**
 * Audio is enabled on entry. If the browser blocks audible autoplay, retry on
 * the first interaction while keeping the control available as an opt-out.
 */
export function SoundToggle() {
  const [on, setOn] = useState(true)
  const soundWantedRef = useRef(true)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const playBackgroundMusic = useCallback(() => {
    const track = audioRef.current
    if (!track || !soundWantedRef.current) return
    track.muted = false
    void track.play().catch(() => {
      // The mount attempt can be blocked. The first page interaction retries it.
    })
  }, [])

  const stopBackgroundMusic = useCallback(() => {
    const track = audioRef.current
    if (!track) return
    // Both operations are intentional: muted silences synchronously, while
    // pause guarantees the media is no longer advancing in the background.
    track.muted = true
    track.pause()
  }, [])

  const toggle = useCallback(() => {
    setOn((currentlyOn) => {
      if (currentlyOn) {
        soundWantedRef.current = false
        stopBackgroundMusic()
        disable()
        return false
      }

      soundWantedRef.current = true
      enable()
      playBackgroundMusic()
      return true
    })
  }, [playBackgroundMusic, stopBackgroundMusic])

  useEffect(() => {
    enable()
    playBackgroundMusic()

    const unlockAudio = (event: Event) => {
      // The moon button owns its interaction. Letting this fallback run first
      // would enable the track immediately before the button turns it off.
      if (event.target instanceof Node && buttonRef.current?.contains(event.target)) return

      if (soundWantedRef.current) {
        enable()
        playBackgroundMusic()
      }
      window.removeEventListener("pointerdown", unlockAudio, true)
      window.removeEventListener("keydown", unlockAudio, true)
    }

    // Audible autoplay is commonly blocked until one of these interactions.
    window.addEventListener("pointerdown", unlockAudio, true)
    window.addEventListener("keydown", unlockAudio, true)

    // Never leave the ambient bed running behind an unmounted scene.
    return () => {
      window.removeEventListener("pointerdown", unlockAudio, true)
      window.removeEventListener("keydown", unlockAudio, true)
      stopBackgroundMusic()
      disable()
    }
  }, [playBackgroundMusic, stopBackgroundMusic])

  return (
    <>
      <audio ref={audioRef} src="/assets/background-music.mp3" loop preload="auto" />
      <button
        ref={buttonRef}
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
    </>
  )
}
