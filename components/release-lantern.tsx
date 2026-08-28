"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import type { LanternTag } from "@/types/lantern"
import { lanternCategories, MAX_MESSAGE_LENGTH } from "@/types/lantern"
import { CategorySelector } from "@/components/category-selector"
import { LanternNote, lanternMessageTextSize } from "@/components/lantern-note"

type ReleaseLanternProps = {
  onRelease: (input: { message: string; tag: LanternTag }) => void
  busy?: boolean
}

/**
 * Writing your own lantern.
 *
 * Deliberately the same staging as reading someone else's: the sky dims, one
 * lantern comes up close, and the message lives on its paper. The only
 * difference is that here the paper is editable — so sending and receiving feel
 * like the same gesture.
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
  const messageTextSize = lanternMessageTextSize(message.length)

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea || !open) return
    textarea.style.height = "auto"
    textarea.style.height = `${textarea.scrollHeight}px`
  }, [message, messageTextSize, open])

  useEffect(() => {
    if (!open) return
    textareaRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className="release-trigger group fixed bottom-5 left-1/2 z-[80] sm:bottom-8"
      >
        <span aria-hidden="true" className="release-trigger__crest">
          <span />
        </span>
        <span aria-hidden="true" className="release-trigger__flourish release-trigger__flourish--left" />
        <span className="release-trigger__label font-serif uppercase">Release a lantern wish</span>
        <span aria-hidden="true" className="release-trigger__flourish release-trigger__flourish--right" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto p-4">
          {/* Same dimmed sky as reading a lantern. */}
          <div
            aria-hidden="true"
            onClick={close}
            className="absolute inset-0 bg-sky-deep/70 backdrop-blur-[3px] duration-500 animate-in fade-in"
          />

          <form
            onSubmit={handleSubmit}
            role="dialog"
            aria-modal="true"
            aria-label="Write a lantern and release it"
            className="relative top-6 my-auto flex flex-col items-center sm:top-8"
          >
            {/* Sized to the lantern so it shares the controls' center line. */}
            <div className="relative h-[min(50dvh,30rem)] max-w-[82vw] aspect-[2/3]">
              {/* Stay near the lantern while clearing its scaled top-right edge. */}
              <button
                type="button"
                onClick={close}
                aria-label="Close without releasing"
                className="absolute -top-16 -right-6 z-20 grid size-11 place-items-center rounded-full border backdrop-blur-sm transition-[background-color,color,border-color] duration-300 hover:bg-glow/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-glow/70 sm:top-0 sm:-right-[45%]"
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
                <>
                  <label htmlFor="lantern-message" className="sr-only">
                    Your message, up to {MAX_MESSAGE_LENGTH} characters
                  </label>
                  <textarea
                    id="lantern-message"
                    ref={textareaRef}
                    value={message}
                    onChange={(event) => setMessage(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
                    maxLength={MAX_MESSAGE_LENGTH}
                    rows={1}
                    placeholder="Type out your wish"
                    className={`w-full resize-none overflow-hidden border-0 bg-transparent text-center font-serif outline-none placeholder:opacity-40 focus-visible:outline-none ${messageTextSize}`}
                    style={{
                      color: category.ink,
                      caretColor: "#000000",
                      textShadow: "0 1px 0 rgba(255,255,255,0.35)",
                    }}
                  />
                </>
              }
              />
            </div>

            {/* The artwork is scaled beyond its layout box, so this spacing
                keeps all metadata and controls below the visible lantern. */}
            <div className="relative mt-[min(16dvh,9rem)] flex flex-col items-center gap-4">
              <div className="absolute bottom-full left-1/2 mb-4 w-[min(90vw,32rem)] -translate-x-1/2">
                <CategorySelector value={tag} onChange={setTag} />
              </div>
              <div className="flex flex-col items-center gap-1.5">
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
                <span aria-live="polite" className="text-xs tabular-nums opacity-65">
                  {remaining} characters left
                </span>
              </div>
              <button
                type="submit"
                disabled={!canRelease}
                className="release-submit font-serif uppercase"
              >
                {busy ? "Releasing…" : "Release into the sky"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
