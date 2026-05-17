import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useStudio, POSE_PRESETS, Model } from "@/lib/store";
import { PresetSelector } from "@/components/PresetSelector";
import type { Preset } from "@/lib/presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Plus, Trash2, Edit3, Upload, User, Baby, BabyIcon, Diamond } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { generateModel, normalizeUploadedModel } from "@/lib/ai.functions";
import { uploadDataUrl, uploadFile } from "@/lib/storage";
import { requireSignIn } from "@/lib/require-auth";
import { getPresetById } from "@/lib/presets";

export const Route = createFileRoute("/_authenticated/models")({
  head: () => ({
    meta: [
      { title: "Models · Virtual Lookbook" },
      { name: "description", content: "Generate inclusive AI fashion models or upload your own full-body photo — femme, masc, plus-size, child, infant, and accessibility presets." },
      { property: "og:title", content: "Models · Virtual Lookbook" },
      { property: "og:description", content: "Generate or upload AI fashion models with inclusive body type, age, and accessibility presets." },
      { property: "og:url", content: "https://virtuallookbookpro.lovable.app/models" },
    ],
    links: [{ rel: "canonical", href: "https://virtuallookbookpro.lovable.app/models" }],
  }),
  component: ModelsPage,
});

function ModelsPage() {
  const { models, removeModel, renameModel } = useStudio();
  const nav = useNavigate();

  return (
    <AppLayout>
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">AI fashion models</div>
          <h1 className="font-display text-4xl md:text-5xl mt-1">Models</h1>
          <p className="text-muted-foreground mt-1 text-sm">Generate a photorealistic AI model — or upload your own full-body photo to see how outfits would look on you.</p>
        </div>
        <CreateModelDialog />
      </header>

      {models.length === 0 ? (
        <div className="mt-10 glass rounded-3xl p-12 text-center">
          <div className="font-display text-2xl">No models yet</div>
          <p className="text-muted-foreground text-sm mt-2">Generate your first AI model to start styling.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {models.map((m: Model) => (
            <div key={m.id} className="group glass rounded-2xl overflow-hidden shadow-soft hover:shadow-glow transition-all">
              <button onClick={() => nav({ to: "/studio", search: { model: m.id } as any })} className="block w-full text-left">
                <div className="aspect-[3/4] bg-dreamy">
                  <img src={m.currentImageUrl} alt={m.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-3">
                  <div className="font-medium truncate">{m.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{m.wornItemIds.length} item(s) styled</div>
                </div>
              </button>
              <div className="px-3 pb-3 flex gap-2">
                <Button aria-label={`Rename model ${m.name}`} size="sm" variant="outline" className="flex-1" onClick={() => {
                  const n = prompt("Rename model", m.name); if (n) renameModel(m.id, n);
                }}><Edit3 className="h-3 w-3" /></Button>
                <Button aria-label={`Delete model ${m.name}`} size="sm" variant="outline" onClick={() => { if (confirm("Delete this model?")) removeModel(m.id); }}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

function CreateModelDialog() {
  const { addModel, user } = useStudio();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"generate" | "upload">("generate");
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [pose, setPose] = useState(POSE_PRESETS[0]);
  const [busy, setBusy] = useState(false);
  const [isChild, setIsChild] = useState(false);
  const [isInfant, setIsInfant] = useState(false);
  const [presetId, setPresetId] = useState<string | undefined>(undefined);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const onPickPreset = (p: Preset) => {
    setPresetId(p.id);
    setPrompt(p.prompt);
    if (p.autoToggleInfant) {
      setIsInfant(true);
      setIsChild(false);
    } else if (p.autoToggleChild) {
      setIsChild(true);
      setIsInfant(false);
    } else {
      setIsChild(false);
      setIsInfant(false);
    }
    if (p.defaultPose && !p.autoToggleInfant && POSE_PRESETS.includes(p.defaultPose)) {
      setPose(p.defaultPose);
    }
  };

  const onPickFile = (f: File | null) => {
    setPhotoFile(f);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(f ? URL.createObjectURL(f) : "");
  };

  const submit = async () => {
    if (!requireSignIn(user, "create a model")) return;
    setBusy(true);
    try {
      let url: string;
      let modelPrompt: string;
      let modelPose: string;
      const preset = presetId ? getPresetById(presetId) : undefined;
      const a11yFlags = preset?.accessibilityFlags;

      if (tab === "upload") {
        if (!photoFile) { toast.error("Choose a full-body photo first"); setBusy(false); return; }
        if (!photoFile.type.startsWith("image/")) { toast.error("That file is not an image"); setBusy(false); return; }
        const rawUrl = await uploadFile(photoFile, "models");
        modelPrompt = prompt.trim() || "Personal reference photo of the user; preserve their face, body, skin tone, hair, and proportions exactly.";
        modelPose = isInfant ? "Top-down on blanket" : pose;
        const norm = await normalizeUploadedModel({ data: { imageUrl: rawUrl, note: prompt, pose: isInfant ? undefined : pose, accessibilityFlags: a11yFlags } });
        if (norm?.dataUrl && !norm.error) {
          try { url = await uploadDataUrl(norm.dataUrl, "models"); }
          catch { url = rawUrl; toast.message("Using your original photo — backdrop step failed."); }
        } else {
          url = rawUrl;
          toast.message(norm?.error ? `Using your original photo — ${norm.error}` : "Using your original photo.");
        }
        const model = await addModel({
          name: name || "My photo",
          prompt: modelPrompt, pose: modelPose,
          baseImageUrl: url, currentImageUrl: url,
          isChild: isChild && !isInfant,
          isInfant: isInfant,
        });
        if (!model) { toast.error("Could not save model"); setBusy(false); return; }
        toast.success("Photo ready ✦");
        setOpen(false);
        setName(""); setPrompt(""); onPickFile(null);
        nav({ to: "/studio", search: { model: model.id } as any });
        setBusy(false);
        return;
      } else {
        if (!prompt.trim()) { toast.error("Describe your model first"); setBusy(false); return; }
        const res = await generateModel({ data: { prompt, pose, isChild: isChild && !isInfant, isInfant, accessibilityFlags: a11yFlags } });
        if (res.error || !res.dataUrl) { toast.error(res.error || "Generation failed"); setBusy(false); return; }
        url = await uploadDataUrl(res.dataUrl, "models");
        modelPrompt = prompt;
        modelPose = isInfant ? "Top-down on blanket" : pose;
      }

      const model = await addModel({
        name: name || "Untitled model",
        prompt: modelPrompt, pose: modelPose,
        baseImageUrl: url, currentImageUrl: url,
        isChild: isChild && !isInfant,
        isInfant: isInfant,
      });
      if (!model) { toast.error("Could not save model"); setBusy(false); return; }
      toast.success("Model generated ✦");
      setOpen(false);
      setName(""); setPrompt(""); onPickFile(null);
      nav({ to: "/studio", search: { model: model.id } as any });
    } catch (e: any) {
      toast.error(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-glow text-primary-foreground shadow-glow"><Plus className="h-4 w-4 mr-1" /> New Model</Button>
      </DialogTrigger>
      <DialogContent className="glass w-[calc(100vw-1rem)] sm:max-w-lg max-h-[90dvh] p-0 flex flex-col gap-0">
        <DialogHeader className="px-5 pt-5 pb-2 shrink-0">
          <DialogTitle className="font-display text-2xl flex items-center gap-2"><Sparkles className="h-5 w-5" /> New Model</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-3">
        <div className="flex items-start gap-2 flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Name (optional)</label>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Luna" className="flex-1 min-w-[140px]" />
              <RandomNameButton onPick={(n) => setName(n)} />
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-1">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="generate"><Sparkles className="h-3.5 w-3.5 mr-1" /> Generate AI</TabsTrigger>
            <TabsTrigger value="upload"><User className="h-3.5 w-3.5 mr-1" /> Use My Photo</TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-3 mt-3">
            <p className="text-xs text-muted-foreground">Your model template is always preserved in its bare base form — styling sessions in the studio create new looks instead of overwriting it.</p>
          </TabsContent>

          <TabsContent value="upload" className="space-y-3 mt-3">
            <div
              onClick={() => fileRef.current?.click()}
              className="rounded-2xl border border-dashed border-border bg-background/40 hover:bg-accent/40 transition cursor-pointer p-6 text-center"
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Your reference" className="mx-auto max-h-64 rounded-xl object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-6 w-6" />
                  <div className="text-sm font-medium text-foreground">Upload a full-body photo of yourself</div>
                  <div className="text-xs">Best results: front-facing, full body, plain background, fitted clothing.</div>
                </div>
              )}
              <input
                ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => onPickFile(e.target.files?.[0] || null)}
              />
            </div>
            {photoPreview && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onPickFile(null)}>Remove Photo</Button>
            )}
            <p className="text-xs text-muted-foreground">Your photo will be re-staged onto the same neutral studio backdrop used for generated models, with your face, body, skin tone, hair, and any mobility aids preserved.</p>
          </TabsContent>
        </Tabs>

        {/* Shared controls — apply to both Generate and Use My Photo */}
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className={`flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer ${isChild && !isInfant ? "bg-glow text-primary-foreground shadow-glow border-transparent" : "glass"}`}>
              <input type="checkbox" className="sr-only" checked={isChild && !isInfant} onChange={(e) => { setIsChild(e.target.checked); if (e.target.checked) setIsInfant(false); }} />
              <Baby className="h-4 w-4" />
              <span className="text-sm font-medium">Child model</span>
            </label>
            <label className={`flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer ${isInfant ? "bg-glow text-primary-foreground shadow-glow border-transparent" : "glass"}`}>
              <input type="checkbox" className="sr-only" checked={isInfant} onChange={(e) => { setIsInfant(e.target.checked); if (e.target.checked) setIsChild(false); }} />
              <BabyIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Infant / baby</span>
            </label>
          </div>
          {isInfant && <p className="text-[11px] text-muted-foreground -mt-1">Infants are photographed top-down on a soft blanket in a plain onesie — for baby clothing only.</p>}
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">
              {tab === "upload" ? "Note about you (optional)" : "Describe your model"}
            </label>
            <div className="mt-1 mb-2">
              <PresetSelector selectedId={presetId} onSelect={onPickPreset} />
            </div>
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={tab === "upload" ? 2 : 4}
              placeholder={tab === "upload" ? 'e.g. "preserve my curly hair, glasses, and wheelchair"'
                : isInfant ? "6-month-old baby, soft brown curls, warm fair skin, peaceful expression..."
                : isChild ? "Cheerful 7-year-old, curly brown hair, light brown skin, freckles..."
                : "Tall androgynous person, soft freckles, natural curls, warm olive skin..."} />
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Presets fill this in and add accessibility context (wheelchair, prosthetic, seated, etc.) — you can still edit freely.
            </p>
          </div>
          {!isInfant && (
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Pose</label>
            <Select value={pose} onValueChange={setPose}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-[50dvh]">{POSE_PRESETS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          )}
        </div>
        </div>

        <DialogFooter className="shrink-0 px-5 py-3 border-t bg-background/60 backdrop-blur flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy} className="bg-glow text-primary-foreground shadow-glow w-full sm:w-auto">
            {busy ? (tab === "upload" ? "Preparing photo…" : "Generating…") : (tab === "upload" ? "Use This Photo ✦" : "Generate ✦")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RandomNameButton({ onPick }: { onPick: (name: string) => void }) {
  const NAMES = [
    "Aurora","Luna","Sage","River","Jett","Ivy","Orion","Cleo","Zephyr","Nova",
    "Kai","Freya","Caspian","Indie","Sol","Rei","Astra","Phoenix","Mira","Dune",
    "Wren","Kira","Echo","Nico","Elio","Ciel","Sable","Terra","Riven","Blaise",
    "Fae","Lux","Oisin","Yara","Quinn","Soren","Tala","Vesper","Zara","Basil",
  ];
  return (
    <button
      type="button"
      onClick={() => onPick(NAMES[Math.floor(Math.random() * NAMES.length)])}
      title="Randomize name"
      className="h-9 w-9 shrink-0 rounded-full bg-glow text-primary-foreground shadow-glow grid place-items-center hover:scale-105 transition-transform"
    >
      <Diamond className="h-4 w-4" />
    </button>
  );
}
