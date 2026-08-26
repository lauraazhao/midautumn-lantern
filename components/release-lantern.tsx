"use client"

import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import type { LanternTag } from "@/types/lantern"
import { lanternCategories, MAX_MESSAGE_LENGTH } from "@/types/lantern"
import { CategorySelector } from "@/components/category-selector"

type ReleaseLanternProps = {
  onRelease: (input: { message: string; tag: LanternTag }) => void
  busy?: boolean
}

/**
 * The bottom-left origin of the experience: a quiet button that opens the
 * writing surface. The randomized lantern placement keeps this corner clear.
 */
export function ReleaseLantern({ onRelease, busy = false }: ReleaseLanternProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [tag, setTag] = useState<LanternTag>("family")
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const category = lanternCategories[tag]
  const remaining = MAX_MESSAGE_LENGTH - message.length
  const canRelease = message.trim().length > 0 && !busy

  useEffect(() => {
    if (open) textareaRef.current?.focus()
  }, [open])

  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canRelease) return
    onRelease({ message: message.trim(), tag })
    setMessage("")
    setOpen(false)
  }

  return (
    <div className="fixed bottom-5 left-4 z-[80] sm:bottom-8 sm:left-8">
      {open && (
        <form
          onSubmit={handleSubmit}
          onKeyDown={(event) => {
            if (event.key === "Escape") close()
          }}
          aria-label="Release a lantern"
          className="mb-3 w-[min(88vw,22rem)] rounded-3xl border border-border bg-card/90 p-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-xl duration-300 animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-serif text-lg leading-snug text-balance">
              What would you like to send into the night?
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="-mt-1 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {/* Writing surface takes on the category's paper color. */}
          <label htmlFor="lantern-message" className="sr-only">
            Your message, up to {MAX_MESSAGE_LENGTH} characters
          </label>
          <textarea
            id="lantern-message"
            ref={textareaRef}
            value={message}
            onChange={(event) => setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={4}
            placeholder="A wish, a thank you, a hope for someone…"
            className="mt-3 w-full resize-none rounded-2xl px-4 py-3 font-serif text-base leading-relaxed transition-colors duration-500 placeholder:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              backgroundColor: category.paper,
              color: category.ink,
              outlineColor: category.color,
            }}
          />

          <div className="mt-1 flex justify-end">
            <span
              aria-live="polite"
              className={`text-xs tabular-nums ${remaining <= 20 ? "text-primary" : "text-muted-foreground"}`}
            >
              {remaining} left
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <CategorySelector value={tag} onChange={setTag} />
            <button
              type="submit"
              disabled={!canRelease}
              className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? "Releasing…" : "Release"}
            </button>
          </div>
        </form>
      )}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="inline-flex min-h-12 items-center gap-2.5 rounded-full border border-primary/30 bg-card/70 px-5 text-sm text-foreground shadow-[0_16px_40px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md transition-colors hover:border-primary/60 hover:bg-card/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <span
          aria-hidden="true"
          className="size-2.5 rounded-full bg-primary shadow-[0_0_12px_2px_var(--glow)]"
        />
        Release a lantern
      </button>
    </div>
  )
}
