"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import type { Lantern } from "@/types/lantern"
import { lanternCategories } from "@/types/lantern"
import { relativeTime } from "@/lib/format-time"
import { LanternNote, lanternMessageTextSize } from "@/components/lantern-note"

type LanternMessageProps = {
  lantern: Lantern
  onClose: () => void
}

/** The opened lantern: a dimmed sky, and one lantern up close with its message on it. */
export function LanternMessage({ lantern, onClose }: LanternMessageProps) {
  const category = lanternCategories[lantern.tag]
  const messageTextSize = lanternMessageTextSize(lantern.message.length)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4">
      {/* The sky stays visible, just dimmed. */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 bg-sky-deep/70 backdrop-blur-[3px] duration-500 animate-in fade-in"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`A ${category.label.toLowerCase()} message, released ${relativeTime(lantern.createdAt)}`}
        className="relative"
      >
        {/* Stay near the lantern while clearing its scaled top-right edge. */}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close message"
          className="absolute -top-16 -right-6 z-20 grid size-11 place-items-center rounded-none border backdrop-blur-sm transition-[background-color,color,border-color] duration-300 hover:bg-glow/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow/70 sm:top-0 sm:-right-[45%]"
          style={{
            borderColor: "color-mix(in oklab, var(--glow) 40%, transparent)",
            backgroundColor: "rgba(255,255,255,0.07)",
            color: "var(--glow)",
          }}
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <LanternNote
          paper={category.paper}
          ink={category.ink}
          accent={category.color}
          message={
            <p
              className={`w-full max-w-full whitespace-pre-wrap break-words font-serif text-pretty ${messageTextSize}`}
              style={{
                overflowWrap: "anywhere",
                textShadow: "0 1px 0 rgba(255,255,255,0.35)",
              }}
            >
              {lantern.message}
            </p>
          }
        />
        {/* The artwork is scaled beyond its layout box, so this spacing clears
            the visible bottom of the lantern rather than only the box. */}
        <div className="mt-[min(16dvh,9rem)] flex flex-col items-center gap-1.5">
          <span
            aria-hidden="true"
            className="h-px w-10 rounded-full"
            style={{ backgroundColor: `${category.ink}33` }}
          />
          <span
            className="font-serif text-xs tracking-[0.2em] uppercase"
            style={{ color: category.color }}
          >
            {category.label}
          </span>
          <span className="text-xs opacity-65">Released {relativeTime(lantern.createdAt)}</span>
        </div>
      </div>
    </div>
  )
}
