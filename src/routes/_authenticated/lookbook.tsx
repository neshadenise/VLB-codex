import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useStudio, Look } from "@/lib/store";
import { Trash2, Plus, Wand2, ArrowLeftRight, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/lookbook")({
  head: () => ({
    meta: [
      { title: "Lookbook · Virtual Lookbook" },
      { name: "description", content: "Your saved AI-styled looks — reopen in the styling studio, rename, compare side-by-side, or organize into collections." },
      { property: "og:title", content: "Lookbook · Virtual Lookbook" },
      { property: "og:description", content: "Your saved AI-styled looks, ready to compare or restyle." },
      { property: "og:url", content: "https://virtuallookbookpro.lovable.app/lookbook" },
    ],
    links: [{ rel: "canonical", href: "https://virtuallookbookpro.lovable.app/lookbook" }],
  }),
  component: LookbookPage,
});

function LookbookPage() {
  const { looks, removeLook, renameLook, models } = useStudio();
  const [selected, setSelected] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id]; // keep only most recent 2
      return [...prev, id];
    });
  };
  const clearSelection = () => setSelected([]);
  const canCompare = selected.length === 2;
  const lookA = looks.find((l) => l.id === selected[0]);
  const lookB = looks.find((l) => l.id === selected[1]);

  return (
    <AppLayout>
      <header className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Saved Looks</div>
          <h1 className="font-display text-4xl md:text-5xl">Lookbook</h1>
          {looks.length >= 2 && (
            <p className="text-xs text-muted-foreground mt-1">
              Tap two looks to select them, then Compare. {selected.length}/2 selected.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <Button variant="ghost" size="sm" className="rounded-full" onClick={clearSelection}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
          <Button
            variant="secondary"
            className="rounded-full"
            disabled={!canCompare}
            onClick={() => setCompareOpen(true)}
            title={canCompare ? "Compare selected looks" : "Select exactly 2 looks to compare"}
          >
            <ArrowLeftRight className="h-4 w-4 mr-1" /> Compare {canCompare ? "(2)" : ""}
          </Button>
          <Button asChild className="rounded-full bg-glow text-primary-foreground shadow-glow">
            <Link to="/studio"><Plus className="h-4 w-4 mr-1" /> New Look</Link>
          </Button>
        </div>
      </header>

      {looks.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <div className="font-display text-2xl">No looks yet</div>
          <p className="text-muted-foreground text-sm mt-2">Style something in the studio and save it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {looks.map((l: Look) => {
            const model = models.find((m) => m.id === l.modelId);
            const isSelected = selected.includes(l.id);
            const selectionIndex = selected.indexOf(l.id);
            return (
              <div
                key={l.id}
                className={cn(
                  "glass rounded-2xl overflow-hidden shadow-soft hover:shadow-glow transition group relative",
                  isSelected && "ring-2 ring-primary shadow-glow",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleSelect(l.id)}
                  aria-pressed={isSelected}
                  aria-label={isSelected ? `Deselect ${l.name}` : `Select ${l.name} to compare`}
                  className="block w-full text-left"
                >
                  <div className="aspect-[3/4] bg-dreamy relative">
                    <img src={l.imageUrl} className="w-full h-full object-cover" alt={l.name} />
                    {isSelected && (
                      <span className="absolute top-2 left-2 h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold shadow-glow">
                        {selectionIndex === 0 ? "A" : "B"}
                      </span>
                    )}
                    <span
                      className={cn(
                        "absolute top-2 right-2 h-6 w-6 rounded-full grid place-items-center transition",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-background/70 backdrop-blur opacity-0 group-hover:opacity-100",
                      )}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </button>
                <div className="p-3">
                  <div className="font-medium truncate">{l.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{model?.name || "—"} · {l.itemIds.length} items</div>
                  <div className="flex justify-between items-center mt-2 gap-2">
                    <span className="text-[10px] text-muted-foreground">{new Date(l.createdAt).toLocaleDateString()}</span>
                    <div className="flex items-center gap-1">
                      {model && (
                        <Button asChild size="sm" variant="secondary" className="h-7 px-2 text-[10px]">
                          <Link to="/studio" search={{ model: l.modelId, look: l.id } as any}>
                            <Wand2 className="h-3 w-3 mr-1" /> Reopen
                          </Link>
                        </Button>
                      )}
                      <button
                        aria-label={`Rename look ${l.name}`}
                        onClick={() => {
                          const n = window.prompt("Rename look", l.name);
                          if (n && n.trim() && n.trim() !== l.name) renameLook(l.id, n.trim());
                        }}
                        className="opacity-60 hover:opacity-100 p-1"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button aria-label={`Delete look ${l.name}`} onClick={() => removeLook(l.id)} className="opacity-60 hover:opacity-100 p-1"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-6xl p-0 bg-background border-border overflow-hidden">
          <DialogTitle className="sr-only">Compare looks side by side</DialogTitle>
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Side by side</div>
                <h2 className="font-display text-2xl">Compare</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCompareOpen(false)} aria-label="Close compare view">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              {[lookA, lookB].map((look, idx) => {
                if (!look) return null;
                const model = models.find((m) => m.id === look.modelId);
                return (
                  <div key={look.id} className="glass rounded-2xl overflow-hidden">
                    <div className="aspect-[3/4] bg-dreamy">
                      <img src={look.imageUrl} alt={look.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-3">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Look {idx === 0 ? "A" : "B"}
                      </div>
                      <div className="font-medium truncate">{look.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {model?.name || "—"} · {look.itemIds.length} items
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
