/** "3 hours ago" style labels, kept dependency-free. */
export function relativeTime(iso: string, now: number = Date.now()) {
  const then = new Date(iso).getTime()
  const minutes = Math.max(0, Math.round((now - then) / 60000))

  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`

  const days = Math.round(hours / 24)
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`

  const months = Math.round(days / 30)
  return `${months} month${months === 1 ? "" : "s"} ago`
}
