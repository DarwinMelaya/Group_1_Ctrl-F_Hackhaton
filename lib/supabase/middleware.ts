import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * Refreshes the Supabase session cookie on every request and guards /admin.
 * Only users whose profile role is 'admin' may open /admin; RLS enforces the same rule in the database.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return response;

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getUser() validates the token with Supabase Auth; do not trust getSession() here.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  if (isAdminRoute) {
    if (!user) return redirectTo(request, response, "/login", { next: pathname + request.nextUrl.search });

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return redirectTo(request, response, "/login", { error: "not_admin" });
  }

  return response;
}

function redirectTo(
  request: NextRequest,
  response: NextResponse,
  path: string,
  params: Record<string, string> = {},
) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = new URLSearchParams(params).toString();
  const redirect = NextResponse.redirect(url);
  // Keep any refreshed auth cookies.
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
