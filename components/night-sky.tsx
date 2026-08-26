"use client"

import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react"
import type { Lantern, LanternTag } from "@/types/lantern"
import { computeDepths, NEAR_DEPTH } from "@/lib/lantern-depth"
import { createLantern } from "@/lib/lantern-repository"
import { randomPlacement, RELEASE_ORIGIN } from "@/lib/lantern-positioning"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { playLanternChime, playLanternRelease } from "@/lib/audio-engine"
import { BackgroundArt, CloudArt, MoonArt } from "@/components/scene-art"
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
    async ({ message, tag }: { message: string; tag: LanternTag }) => {
      const placement = randomPlacement(lanterns)
      const lantern = await createLantern({ message, tag, ...placement })

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
      <BackgroundArt />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 70% at 50% 0%, color-mix(in oklab, var(--sky-mid) 85%, transparent) 0%, transparent 62%)",
        }}
      />

      {/* Moon */}
      <div
        aria-hidden="true"
        className="animate-moon-breathe absolute top-[6%] right-[8%] h-24 w-24 sm:h-32 sm:w-32 lg:h-40 lg:w-40"
      >
        <div
          className="absolute -inset-[60%] rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, color-mix(in oklab, var(--glow) 45%, transparent), transparent 65%)" }}
        />
        <MoonArt className="relative" />
      </div>

      {/* Clouds — slow, distant, non-interactive */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="animate-cloud-drift absolute top-[18%] -left-[10%] h-24 w-[70%] opacity-25 blur-[2px]"
          style={{ "--cloud-duration": "110s" } as CSSProperties}
        >
          <CloudArt />
        </div>
        <div
          className="animate-cloud-drift absolute top-[46%] -right-[15%] h-28 w-[65%] opacity-20 blur-[3px]"
          style={{ "--cloud-duration": "150s", "--cloud-delay": "-40s" } as CSSProperties}
        >
          <CloudArt />
        </div>
        <div
          className="animate-cloud-drift absolute bottom-[6%] left-[5%] h-32 w-[80%] opacity-15 blur-[4px]"
          style={{ "--cloud-duration": "180s", "--cloud-delay": "-90s" } as CSSProperties}
        >
          <CloudArt />
        </div>
      </div>

      {/* ── Caption ────────────────────────────────────────────────────── */}
      <header className="animate-caption-drift pointer-events-none absolute bottom-24 left-1/2 z-[70] flex flex-col items-center gap-1 px-4 sm:bottom-8">
        <h1 className="bg-caption px-3 py-1 text-center text-sm leading-snug tracking-wide text-caption-foreground uppercase text-balance sm:px-4 sm:text-base">
          What are people wishing for this Mid-Autumn Festival?
        </h1>
        <p
          aria-hidden="true"
          className="bg-caption px-3 py-1 text-center text-xs leading-snug tracking-[0.12em] text-caption-foreground uppercase sm:px-4 sm:text-sm"
        >
          {"[Click lantern to read]"}
        </p>
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
          <LanternBody depth={NEAR_DEPTH} rotation={flying.rotation} />
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
    </main>
  )
}
