/**
 * Unique id per Node process. In development, JWTs from a previous `next dev`
 * run are rejected so the browser is not still "signed in" after restarting the dev server.
 */
declare global {
  // eslint-disable-next-line no-var
  var __juliusDevAuthBootId: string | undefined;
}

export function getDevAuthBootId(): string {
  if (process.env.NODE_ENV !== "development") return "";
  if (!globalThis.__juliusDevAuthBootId) {
    globalThis.__juliusDevAuthBootId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;
  }
  return globalThis.__juliusDevAuthBootId;
}
