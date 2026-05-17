import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ThemedFrame, type ThemeKey, THEME_LABELS } from "@/components/ThemedFrame";
import type { CreditPack } from "@/lib/credit-packs";
import { PACK_ICONS, PACK_THEMES } from "@/lib/credit-packs";
import { listAllCreditPacks, upsertCreditPack, deleteCreditPack, reorderCreditPacks } from "@/lib/packs.functions";
import { Crown, Plus, Pencil, Trash2, ArrowUp, ArrowDown, Sparkles, Wand2, Gem, Flame, Waves, Leaf, Moon, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ICONS: Record<string, any> = { sparkles: Sparkles, wand: Wand2, gem: Gem, crown: Crown, flame: Flame, waves: Waves, leaf: Leaf, moon: Moon, heart: Heart };

type Draft = {
  id: string; name: string; tagline: string; badge: string;
  credits: number; bonusCredits: number; priceCents: number; currency: string;
  icon: string; theme: string; highlight: boolean; active: boolean; sortOrder: number;
};

const emptyDraft = (sortOrder: number): Draft => ({
  id: "", name: "", tagline: "", badge: "",
  credits: 100, bonusCredits: 0, priceCents: 999, currency: "usd",
  icon: "sparkles", theme: "pastel", highlight: false, active: true, sortOrder,
});

const toDraft = (p: CreditPack): Draft => ({
  id: p.id, name: p.name, tagline: p.tagline ?? "", badge: p.badge ?? "",
  credits: p.credits, bonusCredits: p.bonusCredits, priceCents: p.priceCents, currency: p.currency,
  icon: p.icon, theme: p.theme, highlight: p.highlight, active: p.active, sortOrder: p.sortOrder,
});

export function CreditPackManager() {
  const listAll = useServerFn(listAllCreditPacks);
  const upsert = useServerFn(upsertCreditPack);
  const del = useServerFn(deleteCreditPack);
  const reorder = useServerFn(reorderCreditPacks);

  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const r: any = await listAll();
    if (r?.error) toast.error(r.error);
    setPacks(r?.packs ?? []);
    setLoading(false);
  }, [listAll]);

  useEffect(() => { refresh(); }, [refresh]);

  const startNew = () => {
    const max = packs.reduce((m, p) => Math.max(m, p.sortOrder), 0);
    setEditing(emptyDraft(max + 10));
    setIsNew(true);
  };
  const startEdit = (p: CreditPack) => { setEditing(toDraft(p)); setIsNew(false); };

  const save = async () => {
    if (!editing) return;
    if (!editing.id.match(/^[a-z0-9_-]{1,40}$/i)) { toast.error("ID must be 1-40 chars (letters/numbers/_/-)"); return; }
    if (!editing.name.trim()) { toast.error("Name required"); return; }
    setBusy(true);
    try {
      const r: any = await upsert({ data: {
        ...editing,
        tagline: editing.tagline || null,
        badge: editing.badge || null,
      }});
      if (!r?.ok) { toast.error(r?.error || "Failed to save"); return; }
      toast.success(`Pack ${isNew ? "created" : "updated"} ✦`);
      setEditing(null);
      await refresh();
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    if (!confirm(`Delete pack "${id}"? This won't affect past purchases.`)) return;
    setBusy(true);
    try {
      const r: any = await del({ data: { id } });
      if (!r?.ok) { toast.error(r?.error || "Failed to delete"); return; }
      toast.success("Pack deleted");
      await refresh();
    } finally { setBusy(false); }
  };

  const move = async (id: string, dir: -1 | 1) => {
    const sorted = [...packs].sort((a, b) => a.sortOrder - b.sortOrder);
    const i = sorted.findIndex(p => p.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sorted.length) return;
    const a = sorted[i], b = sorted[j];
    const order = sorted.map(p => ({ id: p.id, sortOrder: p.sortOrder }));
    order[i] = { id: a.id, sortOrder: b.sortOrder };
    order[j] = { id: b.id, sortOrder: a.sortOrder };
    setBusy(true);
    try {
      const r: any = await reorder({ data: { order } });
      if (!r?.ok) { toast.error(r?.error || "Failed to reorder"); return; }
      await refresh();
    } finally { setBusy(false); }
  };

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-1">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          <h2 className="font-display text-2xl">Credit Pack Management</h2>
        </div>
        <Button onClick={startNew} className="bg-glow text-primary-foreground shadow-glow">
          <Plus className="h-4 w-4 mr-1" /> New pack
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Master-admin only. Changes go live immediately across the app. Past Stripe purchases are not affected.
      </p>

      {loading ? (
        <div className="text-center py-10 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin inline mr-2" /> Loading…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...packs].sort((a,b) => a.sortOrder - b.sortOrder).map((p, idx, arr) => {
            const Icon = ICONS[p.icon] || Sparkles;
            const total = p.credits + p.bonusCredits;
            return (
              <ThemedFrame key={p.id} theme={p.theme as ThemeKey} className={p.active ? "" : "opacity-60"}>
                <div className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <div className="font-display text-lg truncate">{p.name}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {p.highlight && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/15 text-primary">FEAT</span>}
                      {p.badge && <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-glow text-primary-foreground">{p.badge}</span>}
                      {!p.active && <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">OFF</span>}
                    </div>
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">id: {p.id} · {THEME_LABELS[p.theme as ThemeKey] ?? p.theme}</div>
                  {p.tagline && <div className="text-xs text-muted-foreground">{p.tagline}</div>}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-semibold">{total}</span>
                    <span className="text-xs text-muted-foreground">credits{p.bonusCredits > 0 && ` (+${p.bonusCredits})`}</span>
                  </div>
                  <div className="text-sm">${(p.priceCents/100).toFixed(2)} {p.currency.toUpperCase()}</div>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => startEdit(p)} disabled={busy}><Pencil className="h-3 w-3 mr-1" /> Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => move(p.id, -1)} disabled={busy || idx === 0} aria-label="Move up"><ArrowUp className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => move(p.id, 1)} disabled={busy || idx === arr.length - 1} aria-label="Move down"><ArrowDown className="h-3 w-3" /></Button>
                    <Button size="sm" variant="outline" onClick={() => remove(p.id)} disabled={busy} className="text-destructive"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              </ThemedFrame>
            );
          })}
          {packs.length === 0 && <div className="col-span-full text-center text-sm text-muted-foreground py-8">No packs yet. Create one to get started.</div>}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-xl">{isNew ? "New credit pack" : `Edit "${editing?.name}"`}</DialogTitle></DialogHeader>
          {editing && (
            <div className="grid gap-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="ID (used by Stripe metadata)"><Input value={editing.id} disabled={!isNew} onChange={e => setEditing({...editing, id: e.target.value})} placeholder="creator" /></Field>
                <Field label="Name"><Input value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} placeholder="Creator Pack" /></Field>
              </div>
              <Field label="Tagline"><Input value={editing.tagline} onChange={e => setEditing({...editing, tagline: e.target.value})} placeholder="Most popular" /></Field>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Credits"><Input type="number" min={1} value={editing.credits} onChange={e => setEditing({...editing, credits: +e.target.value || 0})} /></Field>
                <Field label="Bonus credits"><Input type="number" min={0} value={editing.bonusCredits} onChange={e => setEditing({...editing, bonusCredits: +e.target.value || 0})} /></Field>
                <Field label="Price (cents)"><Input type="number" min={0} value={editing.priceCents} onChange={e => setEditing({...editing, priceCents: +e.target.value || 0})} /></Field>
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <Field label="Promo badge"><Input value={editing.badge} onChange={e => setEditing({...editing, badge: e.target.value})} placeholder="PROMO" maxLength={24} /></Field>
                <Field label="Icon">
                  <Select value={editing.icon} onValueChange={v => setEditing({...editing, icon: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PACK_ICONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Theme">
                  <Select value={editing.theme} onValueChange={v => setEditing({...editing, theme: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PACK_THEMES.map(t => <SelectItem key={t} value={t}>{THEME_LABELS[t as ThemeKey]}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="flex items-center gap-6 flex-wrap">
                <label className="flex items-center gap-2 text-sm"><Switch checked={editing.highlight} onCheckedChange={v => setEditing({...editing, highlight: v})} /> Featured / recommended</label>
                <label className="flex items-center gap-2 text-sm"><Switch checked={editing.active} onCheckedChange={v => setEditing({...editing, active: v})} /> Active</label>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Live preview</div>
                <ThemedFrame theme={editing.theme as ThemeKey}>
                  <div className="p-4">
                    <div className="font-display text-lg">{editing.name || "Pack name"}</div>
                    <div className="text-xs text-muted-foreground">{editing.tagline || "Tagline"}</div>
                    <div className="text-2xl font-semibold mt-1">{editing.credits + editing.bonusCredits} <span className="text-xs font-normal text-muted-foreground">credits</span></div>
                    <div className="text-sm">${(editing.priceCents/100).toFixed(2)}</div>
                  </div>
                </ThemedFrame>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={busy}>Cancel</Button>
            <Button onClick={save} disabled={busy} className="bg-glow text-primary-foreground shadow-glow">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save pack"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
