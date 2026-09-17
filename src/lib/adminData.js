import { supabase } from "./supabaseClient";

// Admins are only authenticated against the control plane, so they can't
// query a client's own project directly. This goes through the
// admin-read-client-data Edge Function, which verifies the caller is a
// platform admin and does the read server-side with that client's key.
export async function readClientTable(internalClientId, table, options = {}) {
  if (!internalClientId) {
    return { rows: [], count: null, error: "No client selected" };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const { data, error } = await supabase.functions.invoke("admin-read-client-data", {
    body: {
      internal_client_id: internalClientId,
      table,
      select: options.select,
      filters: options.filters,
      order: options.order,
      limit: options.limit,
      count: options.count,
    },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (error || data?.error) {
    // supabase-js hides the real message on a non-2xx response; the actual
    // error our function sent has to be read out of error.context.
    let detail = error?.message || data?.error || "Unknown error";
    if (error?.context) {
      try {
        const body = await error.context.json();
        if (body?.error) detail = body.error;
      } catch {
        // not JSON — keep the generic message
      }
    }
    return { rows: [], count: null, error: detail };
  }

  return { rows: data.rows || [], count: data.count ?? null, error: null };
}

// Writes a client's settings, or triggers an action, through the
// admin-client-control Edge Function. Same reasoning as readClientTable.
export async function writeClientControl(internalClientId, payload) {
  if (!internalClientId) return { ok: false, error: "No client selected" };

  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const { data, error } = await supabase.functions.invoke("admin-client-control", {
    body: { internal_client_id: internalClientId, ...payload },
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  if (error || data?.error) {
    let detail = error?.message || data?.error || "Unknown error";
    if (error?.context) {
      try {
        const body = await error.context.json();
        if (body?.error) detail = body.error;
      } catch {
        // not JSON — keep the generic message
      }
    }
    return { ok: false, error: detail };
  }

  return { ok: true, result: data };
}

// Small shared shape for the "loading / error / empty" states these tables
// all need, so each tab doesn't reinvent it.
export function tableStateMessage({ loading, error, rows, emptyText }) {
  if (loading) return "Loading…";
  if (error) return `Error: ${error}`;
  if (!rows || rows.length === 0) return emptyText || "No rows yet.";
  return null;
}
