import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useStudio, Look } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeftRight, Maximize2, Wand2, ArrowLeft } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/lookbook/compare")({
  head: () => ({
    meta: [
      { title: "Compare looks · Virtual Lookbook" },
      { name: "description", content: "View two saved looks side-by-side to coordinate outfits — swap left and right, go fullscreen, or jump back into the styling studio." },
      { property: "og:title", content: "Compare looks · Virtual Lookbook" },
      { property: "og:description", content: "Side-by-side comparison of two saved AI-styled looks." },
      { property: "og:url", content: "https://virtuallookbookpro.lovable.app/lookbook/compare" },
    ],
    links: [{ rel: "canonical", href: "https://virtuallookbookpro.lovable.app/lookbook/compare" }],
  }),
  component: ComparePage,
});

function LookCard({ look, models, side }: { look: Look | undefined; models: any[]; side: string }) {
  if (!look) {
    return (
      <div className="glass rounded-3xl aspect-[3/4] grid place-items-center text-muted-foreground text-sm">
        Pick a look for {side}
      </div>
    );
  }
  const model = models.find((m) => m.id === look.modelId);
  return (
    <div className="glass rounded-3xl overflow-hidden shadow-soft">
      <div className="aspect-[3/4] bg-dreamy relative group">
        <img src={look.imageUrl} alt={look.name} className="h-full w-full object-cover" />
        <Dialog>
          <DialogTrigger asChild>
            <Button aria-label={`View ${look.name} fullscreen`} size="icon" variant="secondary" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition" title="Fullscreen">
              <Maximize2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl p-0 bg-transparent border-0">
            <img src={look.imageUrl} alt={look.name} className="w-full h-auto rounded-lg" />
          </DialogContent>
        </Dialog>
      </div>
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium truncate">{look.name}</div>
          <div className="text-xs text-muted-foreground truncate">{model?.name || "—"}</div>
        </div>
        <Button asChild size="sm" variant="secondary" className="shrink-0">
          <Link to="/studio" search={{ model: look.modelId, look: look.id } as any}>
            <Wand2 className="h-3 w-3 mr-1" /> Studio
          </Link>
        </Button>
      </div>
    </div>
  );
}

function ComparePage() {
  const { looks, models } = useStudio();
  const [aId, setAId] = useState<string | undefined>(looks[0]?.id);
  const [bId, setBId] = useState<string | undefined>(looks[1]?.id);
  const lookA = useMemo(() => looks.find((l) => l.id === aId), [looks, aId]);
  const lookB = useMemo(() => looks.find((l) => l.id === bId), [looks, bId]);

  const swap = () => { setAId(bId); setBId(aId); };

  return (
    <AppLayout>
      <header className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Coordinate outfits</div>
          <h1 className="font-display text-4xl md:text-5xl">Compare looks</h1>
        </div>
        <Button asChild variant="secondary" className="rounded-full">
          <Link to="/lookbook"><ArrowLeft className="h-4 w-4 mr-1" /> Back to lookbook</Link>
        </Button>
      </header>

      {looks.length < 2 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <div className="font-display text-2xl">Save at least 2 looks first</div>
          <p className="text-muted-foreground text-sm mt-2">Style outfits in the studio and save them to compare.</p>
        </div>
      ) : (
        <>
          <div className="glass rounded-2xl p-4 flex items-center gap-3 flex-wrap mb-5">
            <div className="flex-1 min-w-[160px]">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Look A</div>
              <Select value={aId} onValueChange={setAId}>
                <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>
                  {looks.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button aria-label="Swap left and right looks" size="icon" variant="secondary" onClick={swap} title="Swap left/right" className="mt-4">
              <ArrowLeftRight className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-[160px]">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Look B</div>
              <Select value={bId} onValueChange={setBId}>
                <SelectTrigger><SelectValue placeholder="Choose…" /></SelectTrigger>
                <SelectContent>
                  {looks.map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <LookCard look={lookA} models={models} side="left" />
            <LookCard look={lookB} models={models} side="right" />
          </div>
        </>
      )}
    </AppLayout>
  );
}
