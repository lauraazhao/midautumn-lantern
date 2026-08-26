"use client"

import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import type { Lantern } from "@/types/lantern"
import { lanternCategories } from "@/types/lantern"
import { relativeTime } from "@/lib/format-time"
import { FoldedPaper } from "@/components/folded-paper"

type LanternMessageProps = {
  lantern: Lantern
  onClose: () => void
}

/** The opened note: a dimmed sky, a folded paper, and the message inside it. */
export function LanternMessage({ lantern, onClose }: LanternMessageProps) {
  const category = lanternCategories[lantern.tag]
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
        className="absolute inset-0 bg-sky-deep/65 backdrop-blur-[3px] duration-500 animate-in fade-in"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`A ${category.label.toLowerCase()} message, released ${relativeTime(lantern.createdAt)}`}
        className="relative"
      >
        <FoldedPaper
          paper={category.paper}
          ink={category.ink}
          inside={
            <p className="font-serif text-pretty text-xl leading-relaxed sm:text-2xl">{lantern.message}</p>
          }
          footer={
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2">
                <span
                  className="inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-medium tracking-wide uppercase"
                  style={{ backgroundColor: category.color, color: category.paper }}
                >
                  {category.label}
                </span>
                <span className="text-xs opacity-70">Released {relativeTime(lantern.createdAt)}</span>
              </div>

              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
                style={{ borderColor: `${category.ink}40` }}
              >
                <X className="size-4" aria-hidden="true" />
                Close
              </button>
            </div>
          }
        />
      </div>
    </div>
  )
}
