export const apiBase = process.env.NEXT_PUBLIC_API_BASE || "/api-bridge";

export function joinApiPath(path: string) {
  if (path.startsWith("http")) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${apiBase}${path}`;
  }

  return `${apiBase}/${path}`;
}
