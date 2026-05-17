import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyCredits } from "@/lib/credits.functions";
import { Sparkles, Crown, Plus } from "lucide-react";
import { useStudio } from "@/lib/store";
import { CreditPurchaseModal } from "@/components/CreditPurchaseModal";

export function CreditsPill() {
  const { user } = useStudio();
  const fetchCredits = useServerFn(getMyCredits);
  const [bal, setBal] = useState<number | null>(null);
  const [tier, setTier] = useState<string>("free");
  const [admin, setAdmin] = useState(false);
  const [buyOpen, setBuyOpen] = useState(false);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = async () => {
      try {
        const r: any = await fetchCredits();
        if (alive) { setBal(r.balance ?? 0); setTier(r.tier || "free"); setAdmin(!!r.isAdmin); }
      } catch {}
    };
    load();
    const id = setInterval(load, 15000);
    return () => { alive = false; clearInterval(id); };
  }, [user, fetchCredits]);
  if (!user) return null;
  if (admin) {
    return (
      <div className="h-9 px-3 rounded-full glass flex items-center gap-2 text-xs bg-gradient-to-r from-primary/20 to-primary/5" title="Admin · unlimited">
        <Crown className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium">Unlimited</span>
        <span className="text-muted-foreground">✦</span>
      </div>
    );
  }
  return (
    <>
      <button
        onClick={() => setBuyOpen(true)}
        className="h-9 pl-3 pr-2 rounded-full glass flex items-center gap-2 text-xs hover:bg-primary/5 transition-colors group"
        title={`${tier} tier · click to buy more`}
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium">{bal ?? "—"}</span>
        <span className="text-muted-foreground">credits</span>
        <span className="ml-1 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center group-hover:scale-105 transition-transform">
          <Plus className="h-3.5 w-3.5" />
        </span>
      </button>
      <CreditPurchaseModal open={buyOpen} onOpenChange={setBuyOpen} />
    </>
  );
}
