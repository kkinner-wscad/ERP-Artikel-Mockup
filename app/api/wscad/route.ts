import { NextRequest, NextResponse } from "next/server";
import { normalizeBearerToken } from "../../token";

const allowedHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
const allowedMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);

type ProxyRequest = {
  baseUrl?: string;
  token?: string;
  path?: string;
  method?: string;
  body?: unknown;
};

export async function POST(request: NextRequest) {
  let payload: ProxyRequest;
  try { payload = await request.json() as ProxyRequest; }
  catch { return NextResponse.json({ error: "Ungültiger JSON-Request." }, { status: 400 }); }

  const method = (payload.method || "GET").toUpperCase();
  if (!allowedMethods.has(method)) return NextResponse.json({ error: "HTTP-Methode nicht zugelassen." }, { status: 400 });
  if (!payload.path?.startsWith("/api/v1/")) return NextResponse.json({ error: "Nur Pfade unter /api/v1/ sind zulässig." }, { status: 400 });

  let base: URL;
  try { base = new URL(payload.baseUrl || "http://localhost:10384"); }
  catch { return NextResponse.json({ error: "Ungültige Serveradresse." }, { status: 400 }); }
  if (!allowedHosts.has(base.hostname) || !["http:", "https:"].includes(base.protocol)) return NextResponse.json({ error: "Als Ziel ist ausschließlich die lokale ELECTRIX API zulässig." }, { status: 403 });

  const target = new URL(payload.path, `${base.protocol}//${base.host}`);
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = normalizeBearerToken(payload.token);
  if (!token) return NextResponse.json({ error: "Für Live-Aufrufe ist ein ELECTRIX API-Zugriffstoken erforderlich." }, { status: 401 });
  headers.Authorization = `Bearer ${token}`;
  if (payload.body !== undefined && method !== "GET") headers["Content-Type"] = "application/json";

  try {
    const response = await fetch(target, { method, headers, body: payload.body !== undefined && method !== "GET" ? JSON.stringify(payload.body) : undefined, signal: AbortSignal.timeout(45_000), cache: "no-store" });
    const text = await response.text();
    let data: unknown = text;
    try { data = text ? JSON.parse(text) : null; } catch { /* keep plain text */ }
    return NextResponse.json({ ok: response.ok, status: response.status, statusText: response.statusText, data }, { status: response.ok ? 200 : response.status });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Die lokale ELECTRIX API ist nicht erreichbar." }, { status: 502 });
  }
}
