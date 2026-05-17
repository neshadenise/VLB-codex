import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getBalanceFor, isAdmin } from "./credits.server";

export const getMyCredits = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    try {
      const [c, admin] = await Promise.all([getBalanceFor(userId), isAdmin(userId)]);
      return {
        balance: c.balance,
        generationsUsed: c.generations_used,
        tier: admin ? "admin" : c.tier,
        isAdmin: admin,
      };
    } catch (e: any) {
      return { balance: 0, generationsUsed: 0, tier: "free", isAdmin: false, error: e?.message || "Could not load credits" };
    }
  });

export const getMyRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await isAdmin(context.userId);
    return { isAdmin: admin, role: admin ? "admin" : "user" };
  });
