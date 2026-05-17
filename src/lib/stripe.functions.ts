import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import Stripe from "stripe";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { isAdmin } from "./credits.server";
import { getPackFromDb } from "./packs.functions";
import { getRequest } from "@tanstack/react-start/server";

export const createCreditCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ packId: z.string().min(1).max(50) }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    if (await isAdmin(userId)) {
      return { url: null, admin: true as const };
    }
    const pack = await getPackFromDb(data.packId);
    if (!pack) throw new Error("Invalid pack");
    const totalCredits = pack.credits + pack.bonusCredits;

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as any });
    const origin = new URL(getRequest().url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        quantity: 1,
        price_data: {
          currency: pack.currency || "usd",
          unit_amount: pack.priceCents,
          product_data: {
            name: `${pack.name} — ${totalCredits} credits`,
            description: "Virtual Lookbook image generation credits",
          },
        },
      }],
      success_url: `${origin}/settings?purchase=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/settings?purchase=cancelled`,
      metadata: { user_id: userId, pack_id: pack.id, credits: String(totalCredits) },
    });

    await supabaseAdmin.from("credit_purchases").insert({
      user_id: userId,
      pack_id: pack.id,
      credits: totalCredits,
      amount_cents: pack.priceCents,
      currency: pack.currency || "usd",
      status: "pending",
      stripe_session_id: session.id,
    });

    return { url: session.url, admin: false as const };
  });

export const verifyCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ sessionId: z.string().min(1).max(255) }).parse(input))
  .handler(async ({ data, context }) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as any });
    const session = await stripe.checkout.sessions.retrieve(data.sessionId);

    // Verify ownership
    const { data: purchase } = await supabaseAdmin
      .from("credit_purchases")
      .select("user_id, status, credits")
      .eq("stripe_session_id", data.sessionId)
      .maybeSingle();
    if (!purchase || purchase.user_id !== context.userId) {
      return { ok: false, status: "not_found" as const };
    }

    if (session.payment_status === "paid" && purchase.status !== "completed") {
      const { error } = await supabaseAdmin.rpc("apply_credit_purchase", {
        _session_id: data.sessionId,
        _payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : "",
      });
      if (error) throw error;
      return { ok: true, status: "completed" as const, credits: purchase.credits };
    }

    return { ok: session.payment_status === "paid", status: purchase.status, credits: purchase.credits };
  });

// listPacks moved to packs.functions.ts -> listCreditPacks
