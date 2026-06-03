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

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Public paths that don't need auth
  const publicPaths = ["/login", "/auth/callback"];
  if (publicPaths.some(p => path.startsWith(p))) {
    if (user) {
      // Already logged in — redirect to dashboard
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  // Legacy routes used by the old prototype — allow without auth
  if (path === "/" || path.startsWith("/api/") || path.startsWith("/admin") && path !== "/admin") {
    return supabaseResponse;
  }

  // Not logged in — send to login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Role-based guards
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "user";

  if (path.startsWith("/superadmin") && role !== "superadmin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (path === "/admin" && !["admin", "superadmin"].includes(role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
