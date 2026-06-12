import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const path = request.nextUrl.pathname;

  // API routes return JSON errors; never redirect them to the login page
  if (path.startsWith("/api/")) return supabaseResponse;

  const { data: { user } } = await supabase.auth.getUser();

  // Always allow — auth callback needs to run to set the session cookie
  if (path.startsWith("/auth/")) return supabaseResponse;

  // Login / signup pages — always let through
  if (path.startsWith("/login") || path.startsWith("/signup")) {
    return supabaseResponse;
  }

  // Not logged in — block admin, superadmin, and ai-mastery routes
  if (!user) {
    if (
      path.startsWith("/admin") ||
      path.startsWith("/superadmin") ||
      path.startsWith("/ai-mastery")
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return supabaseResponse;
  }

  // Everything else: let the page handle its own role check
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon(?:\\.png)?|apple-icon(?:\\.png)?|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
