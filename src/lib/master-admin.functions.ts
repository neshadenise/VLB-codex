import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const emailSchema = z.object({ email: z.string().trim().email().max(254) });

function clientMeta() {
  const ip =
    getRequestHeader("cf-connecting-ip") ||
    getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
    undefined;
  const ua = getRequestHeader("user-agent") || undefined;
  return { ip, ua };
}

async function hashCode(code: string) {
  const data = new TextEncoder().encode(code.trim().toUpperCase());
  const buf = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Code format: XXXX-XXXX-XXXX (12 chars from a no-confusable alphabet)
function generateCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(12);
  globalThis.crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < 12; i++) {
    out += alphabet[bytes[i] % alphabet.length];
    if (i === 3 || i === 7) out += "-";
  }
  return out;
}

export const getMasterRecoveryEmail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_master_recovery_email");
    if (error) return { email: null as string | null, error: error.message };
    return { email: (data as unknown as string | null) ?? null };
  });

export const setMasterRecoveryEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string }) => emailSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { ip, ua } = clientMeta();
    const { data: r, error } = await context.supabase.rpc("set_master_recovery_email", {
      _email: data.email,
      _ip: ip,
      _ua: ua,
    });
    if (error) return { error: error.message };
    return { email: r as unknown as string };
  });

export const generateMasterRecoveryCodes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { count?: number }) => ({ count: Math.min(Math.max(d?.count ?? 8, 4), 16) }))
  .handler(async ({ data, context }) => {
    const codes = Array.from({ length: data.count }, generateCode);
    const hashes = await Promise.all(codes.map(hashCode));
    const { ip, ua } = clientMeta();
    const { error } = await context.supabase.rpc("register_master_recovery_codes", {
      _hashes: hashes,
      _ip: ip,
      _ua: ua,
    });
    if (error) return { codes: [] as string[], error: error.message };
    return { codes };
  });

export const revokeMasterRecoveryCodes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ip, ua } = clientMeta();
    const { data, error } = await context.supabase.rpc("revoke_master_recovery_codes", { _ip: ip, _ua: ua });
    if (error) return { error: error.message, revoked: 0 };
    return { revoked: (data as unknown as number) ?? 0 };
  });

export const getMasterRecoveryCodesMeta = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("list_master_recovery_codes_meta");
    if (error) return { total: 0, active: 0, used: 0, last_generated: null as string | null, error: error.message };
    const row = Array.isArray(data) ? data[0] : data;
    return {
      total: row?.total ?? 0,
      active: row?.active ?? 0,
      used: row?.used ?? 0,
      last_generated: (row?.last_generated as string | null) ?? null,
    };
  });

const transferSchema = z.object({
  email: z.string().trim().email().max(254),
  confirm: z.string().max(64),
  keepOldAsAdmin: z.boolean().optional(),
});

export const transferMasterAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; confirm: string; keepOldAsAdmin?: boolean }) => transferSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { ip, ua } = clientMeta();
    const { data: r, error } = await context.supabase.rpc("transfer_master_admin", {
      _target_email: data.email,
      _confirm_phrase: data.confirm,
      _keep_old_as_admin: data.keepOldAsAdmin ?? true,
      _ip: ip,
      _ua: ua,
    });
    if (error) return { error: error.message };
    return { newMasterId: r as unknown as string };
  });

export const listAdminSecurityEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("list_admin_security_events", { _limit: 100 });
    if (error) return { events: [] as any[], error: error.message };
    return { events: (data ?? []) as any[] };
  });

// Export helper for the public recovery route (server-only)
export const __hashRecoveryCode = hashCode;