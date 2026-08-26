import { getLanterns } from "@/lib/lantern-repository"
import { NightSky } from "@/components/night-sky"

/**
 * Data comes in through the repository only, so swapping the mock store for a
 * hosted database later requires no changes here.
 */
export default async function Page() {
  const lanterns = await getLanterns()
  return <NightSky initialLanterns={lanterns} />
}
