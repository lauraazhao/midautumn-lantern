import type { LanternTag } from "@/types/lantern"

/**
 * Terms that strongly signal each category. Multi-word phrases naturally
 * receive more weight so a specific wish wins over incidental vocabulary.
 */
const CATEGORY_TERMS: Record<LanternTag, readonly string[]> = {
  family: [
    "family", "families", "parent", "parents", "mother", "mom", "mum", "father", "dad",
    "sister", "brother", "sibling", "children", "child", "daughter", "son", "grandma", "grandpa",
  ],
  prosperity: [
    "prosperity", "prosperous", "wealth", "wealthy", "money", "fortune", "abundance", "financial",
    "finances", "income", "savings", "afford", "debt", "rich",
  ],
  career: [
    "career", "job", "work", "promotion", "interview", "coworker", "colleague", "office", "business",
    "school", "study", "studies", "exam", "graduate", "graduation", "degree",
  ],
  health: [
    "health", "healthy", "healing", "heal", "recovery", "recover", "wellness", "illness", "sick",
    "disease", "doctor", "hospital", "strength", "pain", "cancer",
  ],
  love: [
    "love", "romance", "romantic", "partner", "marriage", "married", "wedding", "soulmate", "heart",
    "crush", "boyfriend", "girlfriend", "husband", "wife",
  ],
  social: [
    "friend", "friends", "friendship", "community", "neighbor", "neighbour", "everyone", "together",
    "party", "celebrate", "celebration", "peace", "world",
  ],
}

const CATEGORY_PRIORITY: LanternTag[] = ["family", "health", "love", "career", "prosperity", "social"]

function occurrences(message: string, term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return message.match(new RegExp(`\\b${escaped}\\b`, "gu"))?.length ?? 0
}

/** Infer a category from the message, falling back to Social for general wishes. */
export function inferLanternTag(message: string): LanternTag {
  const normalized = message.toLocaleLowerCase().normalize("NFKC")
  let bestTag: LanternTag = "social"
  let bestScore = 0

  for (const tag of CATEGORY_PRIORITY) {
    const score = CATEGORY_TERMS[tag].reduce((total, term) => {
      const weight = term.includes(" ") ? 2 : 1
      return total + occurrences(normalized, term) * weight
    }, 0)

    if (score > bestScore) {
      bestTag = tag
      bestScore = score
    }
  }

  return bestTag
}