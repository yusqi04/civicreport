export function getSafeNextPath(
  value: unknown
): string | null {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return null;
  }

  const url = new URL(value, "https://civicreport.local");
  if (
    url.origin !== "https://civicreport.local" ||
    url.pathname === "/login" ||
    url.pathname === "/register"
  ) {
    return null;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
