import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Server Component / Server Action / Route Handler Supabase client.
 * Executes strictly with the authenticated user's JWT so Postgres RLS is always enforced (TDR-007).
 */
export async function createSupabaseServerClient() {
  const env = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // setAll may be called from a read-only Server Component; middleware handles cookie refresh.
          }
        },
      },
    }
  );
}
