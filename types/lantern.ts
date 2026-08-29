/**
 * Core domain types for the lantern experience.
 *
 * These fields map 1:1 to a future database table:
 *   id | message | tag | created_at | x | y | rotation
 */

export type LanternTag = "family" | "prosperity" | "career" | "health" | "love" | "social"

export type Lantern = {
  id: string
  message: string
  tag: LanternTag
  /** ISO 8601 timestamp. Drives the depth/recency calculation. */
  createdAt: string
  /** Horizontal position in the sky, 0-100 (% of viewport width). */
  x: number
  /** Vertical position in the sky, 0-100 (% of viewport height). */
  y: number
  /** Tilt in degrees. */
  rotation: number
}

/** What the UI hands to the data layer when someone releases a lantern. */
export type NewLantern = {
  message: string
  /** Omitted when the writer leaves category selection to automatic tagging. */
  tag?: LanternTag
  x: number
  y: number
  rotation: number
}

export type LanternCategory = {
  label: string
  /** Saturated category color — used for pills, accents, glow. */
  color: string
  /** Paper surface color for the opened note. */
  paper: string
  /** Text color that stays readable on `paper`. */
  ink: string
}

/**
 * Single source of truth for category styling.
 * TEMPORARY SHADES — safe to retune during visual design.
 */
export const lanternCategories: Record<LanternTag, LanternCategory> = {
  family: {
    label: "Family",
    color: "#C98A4B",
    paper: "#F2DCBE",
    ink: "#40260F",
  },
  prosperity: {
    label: "Prosperity",
    color: "#C0392B",
    paper: "#F3C9C1",
    ink: "#4A1410",
  },
  career: {
    label: "Career",
    color: "#3B62A8",
    paper: "#C7D6F1",
    ink: "#152443",
  },
  health: {
    label: "Health",
    color: "#3E8A62",
    paper: "#C6E3D0",
    ink: "#123526",
  },
  love: {
    label: "Love",
    color: "#C55C86",
    paper: "#F4CEDD",
    ink: "#44152A",
  },
  social: {
    label: "Social",
    color: "#C9A62B",
    paper: "#F0E1AE",
    ink: "#3E3208",
  },
}

export const lanternTags = Object.keys(lanternCategories) as LanternTag[]

export const MAX_MESSAGE_LENGTH = 200
