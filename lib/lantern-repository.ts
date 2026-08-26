import type { Lantern, NewLantern } from "@/types/lantern"
import { mockLanterns } from "@/data/lanterns"

/**
 * The only place that knows where lanterns come from.
 *
 * Right now it reads from local mock data. To move to a hosted database
 * (e.g. Supabase Postgres, free tier) replace the two function bodies below —
 * nothing in the UI needs to change.
 *
 *   create table lanterns (
 *     id         uuid primary key default gen_random_uuid(),
 *     message    text not null check (char_length(message) <= 200),
 *     tag        text not null,
 *     created_at timestamptz not null default now(),
 *     x          real not null,
 *     y          real not null,
 *     rotation   real not null
 *   );
 *
 * Supabase version would look like:
 *
 *   const { data } = await supabase
 *     .from("lanterns")
 *     .select("id, message, tag, created_at, x, y, rotation")
 *     .order("created_at", { ascending: false })
 *     .limit(120)
 *   return data.map(fromRow)
 */

/** In-memory store standing in for the database during the prototype. */
let store: Lantern[] = [...mockLanterns]

export async function getLanterns(): Promise<Lantern[]> {
  return [...store].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function createLantern(input: NewLantern): Promise<Lantern> {
  const lantern: Lantern = {
    id: `lantern-${Math.random().toString(36).slice(2, 10)}`,
    message: input.message.trim(),
    tag: input.tag,
    createdAt: new Date().toISOString(),
    x: input.x,
    y: input.y,
    rotation: input.rotation,
  }

  store = [...store, lantern]
  return lantern
}
