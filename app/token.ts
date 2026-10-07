export function normalizeBearerToken(value?: string) {
  return (value || "").trim().replace(/^Bearer\s+/i, "").trim();
}
