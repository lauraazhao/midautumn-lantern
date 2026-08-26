import type { Lantern, LanternTag } from "@/types/lantern"
import { scatterPositions } from "@/lib/lantern-positioning"

/**
 * Mock lanterns for the prototype.
 *
 * Only the message + tag are authored here; position and rotation are derived
 * deterministically so the sky looks naturally scattered but never shifts
 * between renders. When a real database is connected, these same fields
 * (x, y, rotation) will simply be stored per row instead.
 */

type Seed = {
  message: string
  tag: LanternTag
  /** Hours ago — turned into a createdAt timestamp below. */
  hoursAgo: number
}

const seeds: Seed[] = [
  { message: "First mooncake with my grandmother in six years.", tag: "family", hoursAgo: 2 },
  { message: "Hoping the loan gets approved before winter.", tag: "prosperity", hoursAgo: 5 },
  { message: "I finally sent the application. That part is done.", tag: "career", hoursAgo: 8 },
  { message: "Dad's scan came back clear. That's the whole wish.", tag: "health", hoursAgo: 11 },
  { message: "We're trying again, slower this time.", tag: "love", hoursAgo: 14 },
  { message: "To the people who kept texting when I went quiet.", tag: "social", hoursAgo: 18 },
  { message: "My brother is cooking this year. Brave of him.", tag: "family", hoursAgo: 22 },
  { message: "Let the shop break even by December.", tag: "prosperity", hoursAgo: 27 },
  { message: "Six months in and I still like the work.", tag: "career", hoursAgo: 31 },
  { message: "Sleeping through the night again. Small thing, big thing.", tag: "health", hoursAgo: 36 },
  { message: "Told her how I felt. Waiting is its own season.", tag: "love", hoursAgo: 42 },
  { message: "New city, and someone invited me to dinner.", tag: "social", hoursAgo: 48 },
  { message: "Watching the moon from the balcony my mother chose.", tag: "family", hoursAgo: 55 },
  { message: "Enough saved to stop counting every week.", tag: "prosperity", hoursAgo: 63 },
  { message: "I'd like to lead the next project. Out loud, finally.", tag: "career", hoursAgo: 70 },
  { message: "Walking two kilometres a day since spring.", tag: "health", hoursAgo: 78 },
  { message: "Ten years married and he still packs my lunch.", tag: "love", hoursAgo: 86 },
  { message: "For the group chat that never lets a birthday pass.", tag: "social", hoursAgo: 95 },
  { message: "My kids ask about the rabbit story every year.", tag: "family", hoursAgo: 104 },
  { message: "Rent paid, lights on, a little left over.", tag: "prosperity", hoursAgo: 115 },
  { message: "Leaving the job that made me small.", tag: "career", hoursAgo: 126 },
  { message: "Mum's knee is better. She danced at the table.", tag: "health", hoursAgo: 138 },
  { message: "Long distance until March. We can count that far.", tag: "love", hoursAgo: 150 },
  { message: "Moved home and found my old friends still here.", tag: "social", hoursAgo: 163 },
  { message: "Three generations, one table, too much food.", tag: "family", hoursAgo: 177 },
  { message: "May the harvest be kind to everyone who planted.", tag: "prosperity", hoursAgo: 192 },
  { message: "Studying at night. The exam is in November.", tag: "career", hoursAgo: 208 },
  { message: "Quiet mind, steady hands, one more year.", tag: "health", hoursAgo: 225 },
]

/**
 * Reference point for the mock timestamps: the top of the current hour.
 * Rounding keeps the value identical on the server and the client (no
 * hydration drift) while the sky still reads as "recent".
 */
const REFERENCE = Math.floor(Date.now() / 3_600_000) * 3_600_000

const positions = scatterPositions(seeds.length)

export const mockLanterns: Lantern[] = seeds.map((seed, index) => ({
  id: `lantern-${String(index + 1).padStart(2, "0")}`,
  message: seed.message,
  tag: seed.tag,
  createdAt: new Date(REFERENCE - seed.hoursAgo * 60 * 60 * 1000).toISOString(),
  ...positions[index],
}))
