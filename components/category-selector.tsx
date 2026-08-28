"use client"

import type { LanternTag } from "@/types/lantern"
import { lanternCategories, lanternTags } from "@/types/lantern"

type CategorySelectorProps = {
  value: LanternTag
  onChange: (tag: LanternTag) => void
}

/** Message categories shown together so every option is immediately visible. */
export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  return (
    <div role="radiogroup" aria-label="Message type" className="flex flex-wrap justify-center gap-1.5">
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
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
