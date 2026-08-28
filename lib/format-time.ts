const ONE_DAY_MS = 24 * 60 * 60 * 1000

const releaseDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  // Keep server-rendered and hydrated labels identical in every deployment.
  timeZone: "UTC",
})

/** Relative labels for recent releases; calendar dates after the first day. */
export function relativeTime(iso: string, now: number = Date.now()) {
  const releaseDate = new Date(iso)
  const then = releaseDate.getTime()
  const elapsed = Math.max(0, now - then)

  if (elapsed >= ONE_DAY_MS) return releaseDateFormatter.format(releaseDate)

  const minutes = Math.round(elapsed / 60000)

  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`

  const hours = Math.round(minutes / 60)
  return `${hours} hour${hours === 1 ? "" : "s"} ago`
}
