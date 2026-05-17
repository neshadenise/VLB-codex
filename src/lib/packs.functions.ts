import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CreditPack } from "./credit-packs";

const ID_RE = /^[a-z0-9_-]{1,40}$/i;

const packInput = z.object({
  id: z.string().regex(ID_RE),
  name: z.string().trim().min(1).max(80),
  tagline: z.string().trim().max(120).nullable().optional(),
  badge: z.string().trim().max(24).nullable().optional(),
  credits: z.number().int().min(1).max(1_000_000),
  bonusCredits: z.number().int().min(0).max(1_000_000).default(0),
  priceCents: z.number().int().min(0).max(10_000_000),
  currency: z.string().trim().min(3).max(8).default("usd"),
  icon: z.string().trim().min(1).max(40).default("sparkles"),
  theme: z.string().trim().min(1).max(20).default("pastel"),
  highlight: z.boolean().default(false),
  active: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(100000).default(0),
});

type Row = {
  id: string; name: string; tagline: string | null; badge: string | null;
  credits: number; bonus_credits: number; price_cents: number; currency: string;
  icon: string; theme: string; highlight: boolean; active: boolean; sort_order: number;
};

const toPack = (r: Row): CreditPack => ({
  id: r.id, name: r.name, tagline: r.tagline, badge: r.badge,
  credits: r.credits, bonusCredits: r.bonus_credits, priceCents: r.price_cents,
  currency: r.currency, icon: r.icon, theme: r.theme,
  highlight: r.highlight, active: r.active, sortOrder: r.sort_order,
});

async function fetchAll(includeInactive: boolean): Promise<CreditPack[]> {
  let q = supabaseAdmin.from("credit_packs").select("*").order("sort_order", { ascending: true }).order("id");
  if (!includeInactive) q = q.eq("active", true);
  const { data, error } = await q;
  if (error) throw error;
  return (data as Row[]).map(toPack);
}

export const listCreditPacks = createServerFn({ method: "GET" }).handler(async () => {
  try { return { packs: await fetchAll(false) }; }
  catch (e: any) { return { packs: [], error: e?.message || "Failed to load packs" }; }
});

async function assertMaster(supabase: any) {
  const { data, error } = await supabase.rpc("am_i_master_admin");
  if (error || !data) throw new Error("NOT_MASTER_ADMIN");
}

export const listAllCreditPacks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      await assertMaster(context.supabase);
      return { packs: await fetchAll(true) };
    } catch (e: any) {
      return { packs: [], error: e?.message || "Failed to load packs" };
    }
  });

export const upsertCreditPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => packInput.parse(d))
  .handler(async ({ data, context }) => {
    try {
      await assertMaster(context.supabase);
      const row = {
        id: data.id, name: data.name, tagline: data.tagline ?? null, badge: data.badge ?? null,
        credits: data.credits, bonus_credits: data.bonusCredits, price_cents: data.priceCents,
        currency: data.currency, icon: data.icon, theme: data.theme,
        highlight: data.highlight, active: data.active, sort_order: data.sortOrder,
      };
      const { error } = await supabaseAdmin.from("credit_packs").upsert(row, { onConflict: "id" });
      if (error) throw error;
      return { ok: true as const };
    } catch (e: any) {
      return { ok: false as const, error: e?.message || "Failed to save pack" };
    }
  });

export const deleteCreditPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().regex(ID_RE) }).parse(d))
  .handler(async ({ data, context }) => {
    try {
      await assertMaster(context.supabase);
      const { error } = await supabaseAdmin.from("credit_packs").delete().eq("id", data.id);
      if (error) throw error;
      return { ok: true as const };
    } catch (e: any) {
      return { ok: false as const, error: e?.message || "Failed to delete" };
    }
  });

export const reorderCreditPacks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    order: z.array(z.object({ id: z.string().regex(ID_RE), sortOrder: z.number().int().min(0).max(100000) })).max(200),
  }).parse(d))
  .handler(async ({ data, context }) => {
    try {
      await assertMaster(context.supabase);
      await Promise.all(data.order.map(o =>
        supabaseAdmin.from("credit_packs").update({ sort_order: o.sortOrder }).eq("id", o.id)
      ));
      return { ok: true as const };
    } catch (e: any) {
      return { ok: false as const, error: e?.message || "Failed to reorder" };
    }
  });

// Server-only helper used by stripe checkout
export async function getPackFromDb(id: string): Promise<CreditPack | null> {
  const { data, error } = await supabaseAdmin.from("credit_packs").select("*").eq("id", id).eq("active", true).maybeSingle();
  if (error || !data) return null;
  return toPack(data as Row);
}
