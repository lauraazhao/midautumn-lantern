import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

/**
 * Creates a request-scoped Supabase client. Never hoist this into a module
 * level singleton: on fluid compute one invocation's cookies would leak into
 * another's.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookieOptions: { secure: process.env.NODE_ENV === "production" },
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Called from a Server Component render, where cookies are read only.
          // Safe to ignore: this app is anonymous and has no session to refresh.
        }
      },
    },
  })
}
