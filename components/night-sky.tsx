"use client"

import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react"
import { lanternCategories, type Lantern, type LanternTag } from "@/types/lantern"
import { computeDepths, NEAR_DEPTH } from "@/lib/lantern-depth"
import { createLantern } from "@/lib/lantern-repository"
import { randomPlacement, RELEASE_ORIGIN } from "@/lib/lantern-positioning"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { playLanternChime, playLanternRelease } from "@/lib/audio-engine"
import { BackgroundArt, CloudArt, CloudBottomArt } from "@/components/scene-art"
import { LanternBody, LANTERN_BASE } from "@/components/lantern-body"
import { LanternField } from "@/components/lantern-field"
import { LanternMessage } from "@/components/lantern-message"
import { ReleaseLantern } from "@/components/release-lantern"
import { SoundToggle } from "@/components/sound-toggle"

/** Turns a lantern id into a stable scale degree, so each one has its own tone. */
function toneSeed(id: string) {
  let sum = 0
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i)
  return sum
}

type NightSkyProps = {
  initialLanterns: Lantern[]
}

export function NightSky({ initialLanterns }: NightSkyProps) {
  const [lanterns, setLanterns] = useState(initialLanterns)
  const [showIntro, setShowIntro] = useState(true)
  const [opened, setOpened] = useState<Lantern | null>(null)
  const [flying, setFlying] = useState<Lantern | null>(null)
  // Lanterns that arrived by release: their drift starts at rest so they do
  // not jump the moment the flight animation hands off to the field.
  const [landedIds, setLandedIds] = useState<ReadonlySet<string>>(() => new Set())
  const [announcement, setAnnouncement] = useState("")
  const openerRef = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()

  // Depth is relative to the newest lantern, so it is recalculated on change.
  const depths = useMemo(() => computeDepths(lanterns), [lanterns])

  const handleOpen = useCallback((lantern: Lantern, trigger: HTMLElement) => {
    openerRef.current = trigger
    playLanternChime(toneSeed(lantern.id))
    setOpened(lantern)
  }, [])

  const handleClose = useCallback(() => {
    setOpened(null)
    openerRef.current?.focus()
  }, [])

  const handleRelease = useCallback(
    async ({ message, tag }: { message: string; tag?: LanternTag }) => {
      const placement = randomPlacement(lanterns)
      const lantern = await createLantern({ message, tag, ...placement })

      // The write can fail (offline, rejected by the server). Say so rather
      // than flying a lantern that was never actually saved.
      if (!lantern) {
        setAnnouncement("Your lantern could not be released. Please try again.")
        return
      }

      playLanternRelease()
      setAnnouncement("Your lantern has been released into the sky.")

      setLandedIds((prev) => new Set(prev).add(lantern.id))

      if (reducedMotion) {
        setLanterns((prev) => [...prev, lantern])
        return
      }
      // The lantern joins the field once its flight finishes.
      setFlying(lantern)
    },
    [lanterns, reducedMotion],
  )

  // A straight drift: only a start and an end, so the path never bends.
  const flightVars = useMemo(() => {
    if (!flying) return undefined
    return {
      "--from-x": `${RELEASE_ORIGIN.x}%`,
      "--from-y": `${RELEASE_ORIGIN.y}%`,
      "--to-x": `${flying.x}%`,
      "--to-y": `${flying.y}%`,
    } as CSSProperties
  }, [flying])

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-sky-deep">
      {/* ── Scene backdrop ─────────────────────────────────────────────── */}
      <BackgroundArt className="animate-background-hue" />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 0%, color-mix(in oklab, var(--sky-mid) 85%, transparent) 0%, transparent 62%)",
        }}
      />

      {/* Sparse star layers shimmer at different rates so the sky feels alive. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[3] overflow-hidden">
        <span className="sparkle-layer sparkle-layer-one absolute inset-0" />
        <span className="sparkle-layer sparkle-layer-two absolute inset-0" />
        <span className="sparkle-layer sparkle-layer-three absolute inset-0" />
        <span className="sparkle-layer sparkle-layer-four absolute inset-0" />
        <span className="star-sparkle star-sparkle-one" />
        <span className="star-sparkle star-sparkle-two" />
        <span className="star-sparkle star-sparkle-three" />
        <span className="star-sparkle star-sparkle-four" />
        <span className="star-sparkle star-sparkle-five" />
        <span className="star-sparkle star-sparkle-six" />
        <span className="star-sparkle star-sparkle-seven" />
        <span className="star-sparkle star-sparkle-eight" />
      </div>

      {/* Clouds — slow, distant, non-interactive */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[5]">
        <div
          className="animate-cloud-drift absolute -top-[22%] left-[calc(50%_-_51vw)] w-[102vw] aspect-[3326/1903] opacity-80 brightness-80 blur-[4px]"
          style={{ "--cloud-duration": "180s", "--cloud-delay": "-90s" } as CSSProperties}
        >
          <CloudArt className="animate-background-hue" />
        </div>
        <div
          className="animate-cloud-drift absolute top-[38%] left-[calc(50%_-_26vw)] w-[52vw] aspect-[3326/1903] opacity-80 brightness-80 blur-[3px]"
          style={{ "--cloud-duration": "210s", "--cloud-delay": "-35s" } as CSSProperties}
        >
          <CloudArt className="animate-background-hue" />
        </div>
        <div
          className="animate-cloud-drift absolute -bottom-[28%] left-[calc(50%_-_34vw)] w-[68vw] aspect-[3326/1903] opacity-80 brightness-80 blur-[2px]"
          style={{ "--cloud-duration": "240s", "--cloud-delay": "-170s" } as CSSProperties}
        >
          <CloudArt className="animate-background-hue" />
        </div>
      </div>

      {/* Full-width cloud anchored to the viewport's bottom edge. */}
      <div
        aria-hidden="true"
        className="animate-cloud-bottom-float pointer-events-none absolute inset-x-0 -bottom-4 z-[6] aspect-[3508/2480] w-full brightness-80"
      >
        <CloudBottomArt className="animate-background-hue" />
      </div>

      {/* ── Caption ────────────────────────────────────────────────────── */}
      <header className="animate-caption-drift pointer-events-none absolute top-5 left-1/2 z-[70] flex flex-col items-center gap-1 px-4 text-[#f5dfb2]/60 sm:top-6">
        <h1 className="px-1 text-center font-serif text-sm leading-snug tracking-wide uppercase sm:px-7 sm:text-base sm:text-balance">
          <span className="block whitespace-nowrap sm:inline sm:whitespace-normal">Read what others are wishing for,</span>{" "}
          <span className="block whitespace-nowrap sm:inline sm:whitespace-normal">or make your own</span>
        </h1>
        <span className="sr-only">Select a lantern to read the message written on it.</span>
      </header>

      {/* ── Lanterns ───────────────────────────────────────────────────── */}
      <LanternField lanterns={lanterns} depths={depths} onOpen={handleOpen} landedIds={landedIds} />

      {/* Newly released lantern in flight. It renders through the same body as
          the field lanterns, at the depth it will land with, so the handoff on
          landing is invisible. */}
      {flying && (
        <div
          aria-hidden="true"
          className={`animate-lantern-release pointer-events-none absolute z-[75] grid place-items-center ${LANTERN_BASE}`}
          style={flightVars}
          onAnimationEnd={() => {
            setLanterns((prev) => [...prev, flying])
            setFlying(null)
          }}
        >
          <LanternBody
            depth={NEAR_DEPTH}
            rotation={flying.rotation}
            glowColor={lanternCategories[flying.tag].color}
          />
        </div>
      )}

      {/* ── Credit ─────────────────────────────────────────────────────── */}
      <a
        href="https://laurazhao.com"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-4 bottom-4 z-[70] text-xs tracking-[0.12em] text-glow/55 uppercase transition-colors duration-300 hover:text-glow focus-visible:text-glow focus-visible:outline-none sm:right-6 sm:bottom-6"
      >
        Built by Laura Zhao
      </a>

      {/* ── Controls ───────────────────────────────────────────────────── */}
      <SoundToggle />
      <ReleaseLantern onRelease={handleRelease} busy={Boolean(flying)} />

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      {opened && <LanternMessage lantern={opened} onClose={handleClose} />}

      {showIntro && (
        <div
          className="festival-intro fixed inset-0 z-[200] grid place-items-center overflow-hidden bg-[#050713] px-6"
          onAnimationEnd={(event) => {
            if (event.currentTarget === event.target) setShowIntro(false)
          }}
        >
          <p className="festival-intro__text max-w-3xl text-center font-serif text-2xl leading-snug tracking-[0.04em] text-[#f5dfb2] text-balance sm:text-4xl lg:text-5xl">
            what are people wishing for this Mid-Autumn Festival?
          </p>
        </div>
      )}
    </main>
  )
}
