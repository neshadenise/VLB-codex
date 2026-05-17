import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { createHash } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const Schema = z.object({
  code: z.string().min(8).max(64),
  recoveryEmail: z.string().email().max(254),
  newMasterEmail: z.string().email().max(254),
});

function hashCode(code: string) {
  return createHash("sha256").update(code.trim().toUpperCase()).digest("hex");
}

export const Route = createFileRoute("/api/public/master-recovery")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: unknown;
        try { body = await request.json(); } catch { return json({ error: "INVALID_JSON" }, 400); }
        const parsed = Schema.safeParse(body);
        if (!parsed.success) return json({ error: "INVALID_INPUT" }, 400);

        const ip =
          request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          null;
        const ua = request.headers.get("user-agent") || null;

        const { data, error } = await supabaseAdmin.rpc("consume_master_recovery_code", {
          _code_hash: hashCode(parsed.data.code),
          _recovery_email: parsed.data.recoveryEmail,
          _new_master_email: parsed.data.newMasterEmail,
          _ip: ip ?? undefined,
          _ua: ua ?? undefined,
        });
        if (error) {
          console.error("master-recovery failed", { reason: error.message, ip });
          // Constant-time-ish delay to slow enumeration
          await new Promise((r) => setTimeout(r, 500));
          return json({ error: "RECOVERY_FAILED" }, 400);
        }
        return json({ ok: true, newMasterId: data });
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}