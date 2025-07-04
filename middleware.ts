export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/Buildtour (Chrome extension endpoint)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api/Buildtour|_next/static|_next/image|favicon.ico).*)",
  ],
};
