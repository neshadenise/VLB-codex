import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const sig = request.headers.get("stripe-signature");
        const body = await request.text();
        if (!sig) return new Response("Missing signature", { status: 400 });

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" as any });
        let event: Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
          );
        } catch (err: any) {
          console.error("[stripe-webhook] signature verify failed", err?.message);
          return new Response("Invalid signature", { status: 400 });
        }

        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          if (session.payment_status === "paid") {
            const pi = typeof session.payment_intent === "string" ? session.payment_intent : "";
            const { error } = await supabaseAdmin.rpc("apply_credit_purchase", {
              _session_id: session.id,
              _payment_intent: pi,
            });
            if (error) {
              console.error("[stripe-webhook] apply_credit_purchase failed", error);
              return new Response("DB error", { status: 500 });
            }
          }
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
