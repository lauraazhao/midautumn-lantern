"use client"

import type { LanternTag } from "@/types/lantern"
import { lanternCategories, lanternTags } from "@/types/lantern"

type CategorySelectorProps = {
  value: LanternTag
  onChange: (tag: LanternTag) => void
}

/**
 * Message categories as an inline pill group.
 *
 * Deliberately not a dropdown: all six options stay visible, nothing covers
 * the writing surface, and the selected color previews the paper the message
 * will be written on.
 */
export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <div role="radiogroup" aria-label="Message type" className="flex flex-wrap gap-1.5">
      {lanternTags.map((tag) => {
        const category = lanternCategories[tag]
        const isSelected = tag === value
        return (
          <button
            key={tag}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(tag)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border px-2.5 text-xs transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            style={{
              borderColor: isSelected ? category.color : "var(--border)",
              backgroundColor: isSelected ? `${category.color}33` : "transparent",
              color: isSelected ? "var(--foreground)" : "var(--muted-foreground)",
            }}
          >
            <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: category.color }} />
            {category.label}
          </button>
        )
      })}
    </div>
  )
}
