"use server"

import { createClient } from "@/lib/supabase/server"
import { lanternCategories, MAX_MESSAGE_LENGTH, type Lantern, type LanternTag, type NewLantern } from "@/types/lantern"

/**
 * The only place that knows where lanterns come from.
 *
 * Backed by the `public.lanterns` table in Supabase. Both functions are server
 * actions, so the client can release a lantern without the anon key or the
 * insert ever touching the browser bundle.
 */

/** A row of public.lanterns, in the database's own snake_case. */
type LanternRow = {
  id: string
  message: string
  tag: string
  created_at: string
  x: number
  y: number
  rotation: number
}

/**
 * Only the columns the sky renders. Never `select *`: these rows are
 * user-submitted and the result is serialized down to the client.
 */
const LANTERN_COLUMNS = "id, message, tag, created_at, x, y, rotation"

function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function isLanternTag(value: string): value is LanternTag {
  return Object.hasOwn(lanternCategories, value)
}

function fromRow(row: LanternRow): Lantern {
  return {
    id: row.id,
    message: row.message,
    // The table constrains tag to this same set, but validate anyway so a
    // category added in SQL later can never render with undefined styling.
    tag: isLanternTag(row.tag) ? row.tag : "social",
    createdAt: row.created_at,
    x: row.x,
    y: row.y,
    rotation: row.rotation,
  }
}

/** Every lantern in the sky, oldest first — the order the field expects. */
export async function getLanterns(): Promise<Lantern[]> {
  if (!hasSupabaseConfig()) {
    return []
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("lanterns")
    .select(LANTERN_COLUMNS)
    .order("created_at", { ascending: true })
    .limit(200)

  if (error) {
    console.log("[v0] Failed to load lanterns:", error.message)
    return []
  }

  return (data ?? []).map((row) => fromRow(row as LanternRow))
}

/**
 * Releases a lantern into the sky. Returns null if the submission is invalid,
 * so the caller can keep the composer open instead of faking a success.
 */
export async function createLantern(input: NewLantern): Promise<Lantern | null> {
  const message = input.message.trim()

  // Validate on the server too: the client limit is a convenience, not a
  // guarantee, and a server action is a public endpoint.
  if (message.length === 0 || message.length > MAX_MESSAGE_LENGTH) {
    console.log("[v0] Rejected lantern: message length", message.length)
    return null
  }

  if (!isLanternTag(input.tag)) {
    console.log("[v0] Rejected lantern: unknown tag", input.tag)
    return null
  }

  if (!hasSupabaseConfig()) {
    return {
      id: crypto.randomUUID(),
      message,
      tag: input.tag,
      createdAt: new Date().toISOString(),
      x: input.x,
      y: input.y,
      rotation: input.rotation,
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("lanterns")
    .insert({
      message,
      tag: input.tag,
      x: input.x,
      y: input.y,
      rotation: input.rotation,
    })
    .select(LANTERN_COLUMNS)
    .single()

  if (error || !data) {
    console.log("[v0] Failed to release lantern:", error?.message)
    return null
  }

  return fromRow(data as LanternRow)
}
