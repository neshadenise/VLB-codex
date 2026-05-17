import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const emailSchema = z.object({ email: z.string().trim().email().max(254) });

export const grantAdminByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string }) => emailSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: target, error } = await supabase.rpc("grant_admin_by_email", { _email: data.email });
    if (error) return { error: error.message };
    return { userId: target as unknown as string };
  });

export const revokeAdminByEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string }) => emailSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: target, error } = await supabase.rpc("revoke_admin_by_email", { _email: data.email });
    if (error) return { error: error.message };
    return { userId: target as unknown as string };
  });

export const listAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.rpc("list_admins");
    if (error) return { admins: [] as { user_id: string; email: string; created_at: string }[], error: error.message };
    return { admins: (data ?? []) as { user_id: string; email: string; created_at: string }[] };
  });

export const amIMasterAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase.rpc("am_i_master_admin");
    if (error) return { isMaster: false, error: error.message };
    return { isMaster: !!data };
  });