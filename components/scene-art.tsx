import { cn } from "@/lib/utils"

/**
 * ── ASSET SWAP POINT ──────────────────────────────────────────────────────
 * Every piece of artwork in the scene is rendered here and nowhere else.
 * Interactions, positioning, depth and data never touch these files, so
 * replacing a placeholder is a one-line change:
 *
 *   /public/assets/lantern-placeholder.svg     -> final lantern artwork
 *   /public/assets/moon-placeholder.svg        -> final moon artwork
 *   /public/assets/cloud.png                   -> final cloud artwork
 *   /public/assets/cloud-bottom.png            -> full-width bottom cloud
 *   /public/assets/background-placeholder.svg  -> final background (svg/webp/png)
 *   /public/assets/paper-texture-placeholder.svg -> final paper texture
 *
 * Swap the `src` values below (and the aspect ratios if they change).
 * ─────────────────────────────────────────────────────────────────────────
 */

export const ASSETS = {
  lantern: "/assets/lantern.png",
  moon: "/assets/moon-placeholder.svg",
  cloud: "/assets/cloud.png",
  cloudBottom: "/assets/cloud-bottom.png",
  background: "/assets/background.png",
  paperTexture: "/assets/paper-texture-placeholder.svg",
}

/** Lantern artwork. Sizing/rotation/depth are applied by the parent. */
export function LanternArt({ className }: { className?: string }) {
  return (
    <img
      src={ASSETS.lantern || "/placeholder.svg"}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn("block h-full w-full select-none object-contain", className)}
    />
  )
}

export function MoonArt({ className }: { className?: string }) {
  return (
    <img
      src={ASSETS.moon || "/placeholder.svg"}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn("block h-full w-full select-none object-contain", className)}
    />
  )
}

export function CloudArt({ className }: { className?: string }) {
  return (
    <img
      src={ASSETS.cloud || "/placeholder.svg"}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn("block h-full w-full select-none object-contain", className)}
    />
  )
}

export function CloudBottomArt({ className }: { className?: string }) {
  return (
    <img
      src={ASSETS.cloudBottom}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn("block h-full w-full select-none object-contain object-bottom", className)}
    />
  )
}

export function BackgroundArt({ className }: { className?: string }) {
  return (
    <img
      src={ASSETS.background || "/placeholder.svg"}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={cn("absolute inset-0 h-full w-full select-none object-cover", className)}
    />
  )
}
