import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { CreditPack } from "@/lib/credit-packs";
import { listCreditPacks } from "@/lib/packs.functions";
import { createCreditCheckout } from "@/lib/stripe.functions";
import { Sparkles, Loader2, Wand2, Gem, Crown, Flame, Waves, Leaf, Moon, Heart } from "lucide-react";
import { toast } from "sonner";
import { ThemedFrame } from "@/components/ThemedFrame";

const ICONS: Record<string, any> = { sparkles: Sparkles, wand: Wand2, gem: Gem, crown: Crown, flame: Flame, waves: Waves, leaf: Leaf, moon: Moon, heart: Heart };

export function CreditPurchaseModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const checkout = useServerFn(createCreditCheckout);
  const fetchPacks = useServerFn(listCreditPacks);
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const r: any = await fetchPacks();
      setPacks(r?.packs ?? []);
    })();
  }, [open, fetchPacks]);

  const buy = async (packId: string) => {
    setLoadingId(packId);
    try {
      const res: any = await checkout({ data: { packId } });
      if (res.admin) { toast.success("Admins have unlimited credits ✦"); onOpenChange(false); return; }
      if (res.url) window.location.href = res.url;
    } catch (e: any) {
      toast.error(e?.message || "Could not start checkout");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Buy credits</DialogTitle>
          <DialogDescription>One-time purchase. Credits never expire.</DialogDescription>
        </DialogHeader>
        <div className="grid sm:grid-cols-2 gap-3">
          {packs.map(p => {
            const Icon = ICONS[p.icon] || Sparkles;
            const total = p.credits + p.bonusCredits;
            return (
              <ThemedFrame key={p.id} theme={p.theme as any} className={p.highlight ? "shadow-glow" : ""}>
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <div className="font-display text-lg">{p.name}</div>
                    </div>
                    {p.badge && <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-glow text-primary-foreground">{p.badge}</span>}
                  </div>
                  {p.tagline && <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.tagline}</div>}
                  <div className="flex items-baseline gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span className="text-2xl font-semibold">{total}</span>
                    <span className="text-xs text-muted-foreground">credits{p.bonusCredits > 0 && ` (+${p.bonusCredits} bonus)`}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ${(p.priceCents / 100).toFixed(2)} · ${((p.priceCents / 100) / total).toFixed(3)}/credit
                  </div>
                  <Button onClick={() => buy(p.id)} disabled={loadingId !== null} className="mt-1" variant={p.highlight ? "default" : "outline"}>
                    {loadingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Purchase"}
                  </Button>
                </div>
              </ThemedFrame>
            );
          })}
          {packs.length === 0 && <div className="col-span-full text-center text-sm text-muted-foreground py-8">Loading packs…</div>}
        </div>
        <p className="text-xs text-muted-foreground text-center">Secure checkout via Stripe. Credits are added after payment confirmation.</p>
      </DialogContent>
    </Dialog>
  );
}
