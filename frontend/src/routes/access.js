export const PUBLIC_PATHS = [
  "/",
  "/compare",
  "/compare/results",
  "/auth",
];

export const PROTECTED_PREFIXES = [
  "/profile",
  "/favourites",
  "/history",
  "/alerts",
];

export function isPublicPath(pathname) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function isProtectedPath(pathname) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}