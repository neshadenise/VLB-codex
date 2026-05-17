import { useEffect, useMemo, useState } from "react";
import {
  Command, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronDown, Sparkles, Clock, Dices } from "lucide-react";
import {
  PRESETS, CATEGORY_ORDER, CATEGORY_META, getPresetById, type Preset, type PresetCategory,
} from "@/lib/presets";
import { cn } from "@/lib/utils";

const RECENTS_KEY = "vlb.preset.recents";
const MAX_RECENTS = 5;

function loadRecents(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]"); } catch { return []; }
}
function saveRecent(id: string) {
  if (typeof window === "undefined") return;
  const cur = loadRecents().filter((x) => x !== id);
  cur.unshift(id);
  localStorage.setItem(RECENTS_KEY, JSON.stringify(cur.slice(0, MAX_RECENTS)));
}

export function PresetSelector({
  selectedId,
  onSelect,
  className,
}: {
  selectedId?: string;
  onSelect: (preset: Preset) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => { if (open) setRecents(loadRecents()); }, [open]);

  const selected = selectedId ? getPresetById(selectedId) : undefined;

  const grouped = useMemo(() => {
    const map = new Map<PresetCategory, Preset[]>();
    for (const c of CATEGORY_ORDER) map.set(c, []);
    for (const p of PRESETS) map.get(p.category)!.push(p);
    return map;
  }, []);

  const pick = (p: Preset) => {
    saveRecent(p.id);
    onSelect(p);
    setOpen(false);
  };
  const pickRandom = () => {
    const p = PRESETS[Math.floor(Math.random() * PRESETS.length)];
    pick(p);
  };

  const SelectedIcon = selected ? CATEGORY_META[selected.category].icon : Sparkles;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "w-full flex items-center gap-3 rounded-xl glass px-3 py-2.5 text-left",
          "hover:bg-accent/40 transition",
          className,
        )}
      >
        <span className={cn(
          "h-9 w-9 shrink-0 rounded-lg grid place-items-center bg-gradient-to-br",
          selected ? CATEGORY_META[selected.category].color : "from-primary/30 to-primary/10",
        )}>
          <SelectedIcon className="h-4 w-4 text-foreground/80" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
            {selected ? selected.category : "Choose a model preset"}
          </span>
          <span className="block text-sm font-medium truncate">
            {selected ? selected.name : "Browse presets — femme, masc, plus-size, child, accessibility…"}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "p-0 gap-0 glass max-w-2xl",
            // Mobile bottom-sheet
            "max-sm:!fixed max-sm:!inset-x-0 max-sm:!bottom-0 max-sm:!top-auto",
            "max-sm:!translate-x-0 max-sm:!translate-y-0 max-sm:!left-0",
            "max-sm:!max-w-none max-sm:!w-full max-sm:!rounded-b-none max-sm:!rounded-t-3xl",
            "max-sm:!h-[85vh]",
          )}
        >
          <DialogHeader className="px-4 pt-4 pb-2">
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Model presets
            </DialogTitle>
          </DialogHeader>

          <Command className="bg-transparent">
            <div className="px-3 pb-2">
              <CommandInput
                placeholder="Search style, body type, age, aesthetic, keyword…"
                className="h-10"
              />
            </div>

            <div className="px-3 pb-2 flex items-center gap-2">
              <Button
                type="button" variant="outline" size="sm"
                onClick={pickRandom}
                className="rounded-full"
              >
                <Dices className="h-3.5 w-3.5 mr-1" /> Random preset ✦
              </Button>
              <span className="text-[11px] text-muted-foreground">
                {PRESETS.length} presets · {CATEGORY_ORDER.length} categories
              </span>
            </div>

            <CommandList className="max-h-[60vh] max-sm:max-h-none max-sm:flex-1 px-1">
              <CommandEmpty>No presets match that search.</CommandEmpty>

              {recents.length > 0 && (
                <CommandGroup
                  heading={
                    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest">
                      <Clock className="h-3 w-3" /> Recently used
                    </span>
                  }
                  className="[&_[cmdk-group-heading]]:sticky [&_[cmdk-group-heading]]:top-0 [&_[cmdk-group-heading]]:bg-background/85 [&_[cmdk-group-heading]]:backdrop-blur [&_[cmdk-group-heading]]:z-10"
                >
                  {recents.map((id) => {
                    const p = getPresetById(id);
                    if (!p) return null;
                    return <PresetRow key={`r-${p.id}`} preset={p} onPick={pick} selected={p.id === selectedId} />;
                  })}
                </CommandGroup>
              )}

              {CATEGORY_ORDER.map((cat) => {
                const list = grouped.get(cat) || [];
                if (list.length === 0) return null;
                const Icon = CATEGORY_META[cat].icon;
                return (
                  <CommandGroup
                    key={cat}
                    heading={
                      <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest">
                        <Icon className="h-3 w-3" /> {cat}
                      </span>
                    }
                    className="[&_[cmdk-group-heading]]:sticky [&_[cmdk-group-heading]]:top-0 [&_[cmdk-group-heading]]:bg-background/85 [&_[cmdk-group-heading]]:backdrop-blur [&_[cmdk-group-heading]]:z-10"
                  >
                    {list.map((p) => (
                      <PresetRow key={p.id} preset={p} onPick={pick} selected={p.id === selectedId} />
                    ))}
                  </CommandGroup>
                );
              })}
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PresetRow({
  preset, onPick, selected,
}: {
  preset: Preset;
  onPick: (p: Preset) => void;
  selected?: boolean;
}) {
  const Icon = CATEGORY_META[preset.category].icon;
  // Build a value string so cmdk filters across name + description + tags + bodyType + ageGroup.
  const value = [
    preset.name, preset.category, preset.description,
    preset.tags.join(" "), preset.bodyType, preset.ageGroup,
    (preset.accessibilityFlags || []).join(" "),
  ].filter(Boolean).join(" ").toLowerCase();

  return (
    <CommandItem
      value={value}
      onSelect={() => onPick(preset)}
      className={cn(
        "flex items-start gap-3 py-2.5 cursor-pointer",
        selected && "bg-accent/60",
      )}
    >
      <span className={cn(
        "h-10 w-10 shrink-0 rounded-lg grid place-items-center bg-gradient-to-br",
        CATEGORY_META[preset.category].color,
      )}>
        <Icon className="h-4 w-4 text-foreground/80" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium truncate">{preset.name}</span>
        <span className="block text-[11px] text-muted-foreground truncate">{preset.description}</span>
        {preset.tags.length > 0 && (
          <span className="mt-1 flex flex-wrap gap-1">
            {preset.tags.slice(0, 4).map((t) => (
              <span key={t} className="text-[9px] px-1.5 py-0.5 rounded-full bg-background/60 border border-border/50 text-muted-foreground">
                {t}
              </span>
            ))}
          </span>
        )}
      </span>
    </CommandItem>
  );
}