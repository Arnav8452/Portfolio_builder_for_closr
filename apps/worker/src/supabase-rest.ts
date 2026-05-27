import type { Json } from "@closr/database/types";
import { env } from "./env.js";

type SupabaseError = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return [] as unknown as T;
  return JSON.parse(text) as T;
}

export async function supabaseFetch<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${env.supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: env.supabaseServiceRoleKey,
      Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const error = await readJson<SupabaseError>(response).catch(() => undefined);
    throw new Error(error?.message ?? `Supabase request failed: ${response.status}`);
  }

  return readJson<T>(response);
}

export function rpc<T>(name: string, args: Record<string, Json | undefined>) {
  return supabaseFetch<T>(`/rest/v1/rpc/${name}`, {
    method: "POST",
    body: JSON.stringify(args),
  });
}

export function insertRow<T>(table: string, payload: Record<string, Json | undefined>) {
  return supabaseFetch<T>(`/rest/v1/${table}`, {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
}

export function updateRow<T>(table: string, id: string, payload: Record<string, Json | undefined>) {
  return supabaseFetch<T>(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
}

export function upsertRow<T>(table: string, payload: Record<string, Json | undefined>, onConflict: string) {
  return supabaseFetch<T>(`/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}`, {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify(payload),
  });
}

export function getRow<T>(table: string, query: string) {
  return supabaseFetch<T>(`/rest/v1/${table}?${query}`, {
    method: "GET",
  });
}
