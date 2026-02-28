import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // --- Maintenance mode check ---
  // Routes that are always accessible (even during maintenance)
  const isMaintenanceBypass =
    pathname === "/maintenance" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/auth/sign");

  let isMaintenanceActive = false;

  // Always check maintenance status (needed for auth redirect logic too)
  try {
    const { data: flagRow } = await supabase
      .from("shop_settings")
      .select("value")
      .eq("key", "feature_flags")
      .single();

    isMaintenanceActive = flagRow?.value?.maintenanceMode === true;
  } catch {
    // If we can't read flags, assume maintenance is off
  }

  // Enforce maintenance mode on non-bypass routes
  if (isMaintenanceActive && !isMaintenanceBypass) {
    // Check if user is admin or staff — they can bypass maintenance
    let isStaffOrAdmin = false;

    if (user) {
      try {
        const { data: dbUser } = await supabase
          .from("users")
          .select("roles:role_id(name)")
          .eq("id", user.id)
          .single();

        const roleName = (dbUser?.roles as unknown as { name: string } | null)
          ?.name;
        isStaffOrAdmin = roleName === "admin" || roleName === "staff";
      } catch {
        // fail open
      }
    }

    if (!isStaffOrAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/maintenance";
      return NextResponse.redirect(url);
    }
  }

  // If admin/staff visits /maintenance directly but maintenance is off,
  // redirect them back to home
  if (pathname === "/maintenance" && user) {
    if (!isMaintenanceActive) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // If maintenance IS on, check if user is staff/admin — redirect them to home
    // since the site works fine for them
    try {
      const { data: dbUser } = await supabase
        .from("users")
        .select("roles:role_id(name)")
        .eq("id", user.id)
        .single();

      const roleName = (dbUser?.roles as unknown as { name: string } | null)
        ?.name;

      if (roleName === "admin" || roleName === "staff") {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    } catch {
      // fail open
    }
  }

  // --- Auth route protection ---
  // Public routes
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/maintenance" ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/auth/sign") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/seed") ||
    pathname.startsWith("/promote-admin") ||
    pathname.startsWith("/unauthorized") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/contact");

  // Redirect to sign-in if not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    return NextResponse.redirect(url);
  }

  // Redirect to home if authenticated and trying to access auth pages
  // Skip during maintenance — users need to access sign-in to switch accounts
  if (
    !isMaintenanceActive &&
    user &&
    (pathname.startsWith("/sign-in") ||
      pathname.startsWith("/sign-up") ||
      pathname.startsWith("/auth/sign"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
