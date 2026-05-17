import { createFileRoute, Link } from "@tanstack/react-router";
import { useStudio } from "@/lib/store";
import { Sparkles, ArrowRight, Wand2, Shirt, BookHeart, Moon, Sun, Leaf, Eye, Crown, Plus, Flame, Waves, Zap } from "lucide-react";
import { useEffect, useMemo, useRef, useState, CSSProperties } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getMyCredits } from "@/lib/credits.functions";
import musePastel from "@/assets/muse/pastel.jpg";
import museAstro from "@/assets/muse/astro.jpg";
import museNature from "@/assets/muse/nature.jpg";
import museFlame from "@/assets/muse/flame.jpg";
import museOcean from "@/assets/muse/ocean.jpg";

const MUSE_PLACEHOLDERS: Record<string, string> = {
  pastel: musePastel,
  astro: museAstro,
  nature: museNature,
  flame: museFlame,
  ocean: museOcean,
  // Reuse astro art for Chrome Barbed until a dedicated asset ships.
  barbed: museAstro,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Virtual Lookbook · AI fashion studio for everyone" },
      { name: "description", content: "Generate inclusive AI fashion models, dress them with your real clothes, and build private lookbooks, collections, and moodboards." },
      { property: "og:title", content: "Virtual Lookbook · AI fashion studio for everyone" },
      { property: "og:description", content: "Generate inclusive AI fashion models, dress them with your real clothes, and build private lookbooks, collections, and moodboards." },
      { property: "og:url", content: "https://virtuallookbookpro.lovable.app/" },
    ],
    links: [{ rel: "canonical", href: "https://virtuallookbookpro.lovable.app/" }],
  }),
  component: Landing,
});

function Landing() {
  const { user, theme, setTheme, models, looks, items } = useStudio();
  const fetchCredits = useServerFn(getMyCredits);
  const [credits, setCredits] = useState<{ balance: number; tier: string; isAdmin: boolean } | null>(null);
  useEffect(() => {
    if (!user) { setCredits(null); return; }
    let alive = true;
    (async () => {
      try {
        const r: any = await fetchCredits();
        if (alive) setCredits({ balance: r.balance ?? 0, tier: r.tier || "free", isAdmin: !!r.isAdmin });
      } catch {}
    })();
    return () => { alive = false; };
  }, [user, fetchCredits]);
  const THEMES = ["pastel", "astro", "nature", "flame", "ocean", "barbed"] as const;
  type ThemeKey = typeof THEMES[number];
  const META: Record<ThemeKey, { label: string; nextLabel: string; Icon: typeof Sun }> = {
    pastel: { label: "Pastel Princess", nextLabel: "Dark Astrology", Icon: Moon  },
    astro:  { label: "Dark Astrology",  nextLabel: "Green Nature",   Icon: Leaf  },
    nature: { label: "Green Nature",    nextLabel: "Ember Flames",         Icon: Flame },
    flame:  { label: "Ember Flames",          nextLabel: "Tidal Ocean",          Icon: Waves },
    ocean:  { label: "Tidal Ocean",           nextLabel: "Chrome Barbed", Icon: Zap   },
    barbed: { label: "Chrome Barbed",         nextLabel: "Pastel Princess", Icon: Sun  },
  };
  const cycleTheme = () => {
    const i = THEMES.indexOf(theme as ThemeKey);
    setTheme(THEMES[(i + 1) % THEMES.length]);
  };
  const meta = META[theme as ThemeKey] ?? META.pastel;
  const NextIcon = meta.Icon;
  const cta = user ? { to: "/closet", label: "Open your closet" } : { to: "/login", label: "Sign in to start" };
  const heroRef = useRef<HTMLDivElement>(null);

  // Muse: prefer the most recently saved styled look; fallback to the latest model template.
  const latestModel = useMemo(() => {
    if (!models?.length) return null;
    return [...models].sort((a, b) => b.createdAt - a.createdAt)[0];
  }, [models]);
  const latestLook = useMemo(() => {
    if (!looks?.length) return null;
    return [...looks].sort((a, b) => b.createdAt - a.createdAt)[0];
  }, [looks]);
  const placeholder = MUSE_PLACEHOLDERS[theme] || MUSE_PLACEHOLDERS.pastel;
  // Only signed-in users with a saved look see their personal muse.
  // Logged-out users and signed-in users with no saved looks see the themed placeholder.
  const museImage = (user && latestLook?.imageUrl) || placeholder;
  const isPlaceholder = !(user && latestLook?.imageUrl);

  // Cursor spotlight
  const onMove = (e: React.MouseEvent) => {
    const el = heroRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  // Reveal-on-scroll
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const key = (e.target as HTMLElement).dataset.reveal!;
          setRevealed((p) => ({ ...p, [key]: true }));
        }
      }
    }, { threshold: 0.18 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const reveal = (k: string): CSSProperties => ({
    opacity: revealed[k] ? 1 : 0,
    transform: revealed[k] ? "translateY(0)" : "translateY(28px)",
    transition: "opacity 0.8s ease, transform 0.8s cubic-bezier(.2,.7,.2,1)",
  });

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 stars animate-twinkle" aria-hidden />
      <div className="pointer-events-none fixed inset-0 petals" aria-hidden />
      <div className="pointer-events-none fixed inset-0 leaves" aria-hidden />
      <div className="pointer-events-none fixed inset-0 theme-ornament theme-ornament-pastel" aria-hidden />
      <div className="pointer-events-none fixed inset-0 theme-ornament theme-ornament-astro" aria-hidden />
      <div className="pointer-events-none fixed inset-0 theme-ornament theme-ornament-nature" aria-hidden />
      <div className="pointer-events-none fixed inset-0 theme-ornament theme-ornament-flame" aria-hidden />
      <div className="pointer-events-none fixed inset-0 theme-ornament theme-ornament-ocean" aria-hidden />
      <div className="pointer-events-none fixed inset-0 bg-dreamy opacity-30 animate-shimmer" aria-hidden />

      {/* HERO */}
      <section
        ref={heroRef}
        onMouseMove={onMove}
        className="relative mx-auto max-w-6xl px-6 py-16 md:py-28"
      >
        <div className="pointer-events-none absolute inset-0 spotlight" aria-hidden />

        <div className="relative grid md:grid-cols-[1.15fr_1fr] gap-10 items-center">
          <div>
            <button
              onClick={cycleTheme}
              className="animate-rise inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs uppercase tracking-[0.25em] hover:shadow-glow transition"
              title="Cycle theme"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-glow shadow-glow" />
              {meta.label} · tap for {meta.nextLabel}
              <NextIcon className="h-3 w-3" />
            </button>

            <h1 className="animate-rise-delay-1 mt-5 font-display text-5xl md:text-7xl leading-[1.02] text-foreground max-w-3xl">
              Generate your <span className="text-gradient animate-shimmer">muse</span>.
              <br />
              Dress them with AI. <span className="inline-block animate-float">Glow.</span>
            </h1>

            <p className="animate-rise-delay-2 mt-5 max-w-xl text-foreground/70 text-lg">
              Prompt a photorealistic fashion model. Upload clothes — AI styles them onto your model. Save looks, build moodboards, refine with words.
            </p>

            <div className="animate-rise-delay-3 mt-8 flex flex-wrap gap-3">
              <Link
                to={cta.to as any}
                className="group inline-flex items-center gap-2 rounded-full bg-glow px-6 py-3 text-sm font-medium text-primary-foreground shadow-glow hover:scale-[1.03] active:scale-95 transition-transform"
              >
                <Sparkles className="h-4 w-4 group-hover:rotate-12 transition-transform" /> {cta.label}
              </Link>
              {!user && (
                <>
                <Link
                  to="/login"
                  search={{ redirect: "/closet" } as any}
                  className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 text-sm font-medium hover:shadow-glow transition-shadow"
                >
                  Create an account
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/closet"
                  className="inline-flex items-center gap-2 rounded-full glass px-6 py-3 text-sm font-medium hover:shadow-glow transition-shadow"
                  title="Browse the UI and build your closet — sign in later to generate"
                >
                  <Eye className="h-4 w-4" /> Browse without signing in
                </Link>
                </>
              )}
            </div>
          </div>

          {/* Floating muse mockup */}
          <div className="relative h-[420px] md:h-[520px] hidden md:block">
            <div className="absolute inset-0 grid place-items-center">
              <div className="relative h-72 w-72 rounded-full bg-glow shadow-glow opacity-80 animate-pulse-glow" />
            </div>
            <div className="absolute inset-0 animate-orbit">
              <FloatChip className="absolute top-4 left-6" icon={<Shirt className="h-4 w-4" />} label="Upload" />
              <FloatChip className="absolute top-1/3 right-2" icon={<Wand2 className="h-4 w-4" />} label="Style" />
              <FloatChip className="absolute bottom-8 left-10" icon={<BookHeart className="h-4 w-4" />} label="Lookbook" />
              <FloatChip className="absolute bottom-20 right-8" icon={<Sparkles className="h-4 w-4" />} label="Glow" />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-8 animate-float">
              <div className="glass rounded-3xl p-3 w-44 shadow-soft">
                <div className="aspect-[3/4] rounded-2xl bg-dreamy overflow-hidden">
                  <img
                    src={museImage}
                    alt={isPlaceholder ? `${theme} muse placeholder` : "Your latest muse"}
                    loading="lazy"
                    width={768}
                    height={1024}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">Your Muse</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {user && (
        <section className="relative mx-auto max-w-6xl px-6 pb-4">
          <div className="glass rounded-3xl p-5 md:p-6 grid md:grid-cols-[auto_1fr_auto] gap-5 items-center">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-dreamy overflow-hidden shrink-0 shadow-soft">
                <img
                  src={museImage}
                  alt={isPlaceholder ? `${theme} muse placeholder` : "Your latest muse"}
                  loading="lazy"
                  width={160}
                  height={160}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Welcome Back</div>
                <div className="font-display text-2xl leading-tight">{latestLook?.name || latestModel?.name || "Your studio awaits"}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {items.length} item{items.length === 1 ? "" : "s"} · {models.length} muse{models.length === 1 ? "" : "s"} · {looks.length} look{looks.length === 1 ? "" : "s"}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center">
              {credits?.isAdmin ? (
                <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm bg-gradient-to-r from-primary/20 to-primary/5">
                  <Crown className="h-4 w-4 text-primary" /> <span className="font-medium">Unlimited credits</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-3 rounded-full glass px-5 py-2.5 text-sm">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-medium">{credits?.balance ?? "—"} credits</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground capitalize">{credits?.tier ?? "free"} tier</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Link to="/studio" className="inline-flex items-center gap-1.5 rounded-full bg-glow px-4 py-2 text-xs font-medium text-primary-foreground shadow-glow hover:scale-[1.03] transition-transform">
                <Wand2 className="h-3.5 w-3.5" /> Studio
              </Link>
              <Link to="/closet" className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-xs hover:shadow-glow transition">
                <Shirt className="h-3.5 w-3.5" /> Closet
              </Link>
              <Link to="/lookbook" className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-xs hover:shadow-glow transition">
                <BookHeart className="h-3.5 w-3.5" /> Lookbook
              </Link>
              {!credits?.isAdmin && (
                <Link to="/settings" className="inline-flex items-center gap-1.5 rounded-full glass px-4 py-2 text-xs hover:shadow-glow transition">
                  <Plus className="h-3.5 w-3.5" /> Credits
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <div data-reveal="title" style={reveal("title")} className="mb-10">
          <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Three Moves</div>
          <h2 className="font-display text-4xl md:text-5xl mt-1">From Closet to <span className="text-gradient">Cover Shoot</span>.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { i: <Shirt className="h-5 w-5" />, t: "Upload", d: "Drop garments — Lovable AI auto-tags brand, color, category." },
            { i: <Wand2 className="h-5 w-5" />, t: "Style", d: "Pick a muse. Try things on. Restyle with a sentence." },
            { i: <BookHeart className="h-5 w-5" />, t: "Save", d: "Build looks, collections, moodboards. Share the glow." },
          ].map((s, idx) => (
            <div
              key={s.t}
              data-reveal={`step-${idx}`}
              style={reveal(`step-${idx}`)}
              className="group glass rounded-3xl p-6 hover:shadow-glow transition-all hover:-translate-y-1"
            >
              <div className="h-10 w-10 rounded-2xl bg-glow shadow-glow grid place-items-center text-primary-foreground group-hover:rotate-6 transition-transform">
                {s.i}
              </div>
              <div className="font-display text-2xl mt-3">{s.t}</div>
              <p className="text-sm text-muted-foreground mt-1">{s.d}</p>
            </div>
          ))}
        </div>

        {/* Theme preview strip */}
        <div data-reveal="strip" style={reveal("strip")} className="mt-14 glass rounded-3xl p-6 md:p-8 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-glow opacity-30 blur-3xl animate-drift" />
          <div className="relative grid md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Six Moods</div>
              <h3 className="font-display text-3xl mt-1">Pastel Princess · Dark Astrology · Green Nature · Ember Flames · Tidal Ocean · Chrome Barbed</h3>
              <p className="text-sm text-muted-foreground mt-2">
                The whole studio shifts with your mood — lavender haze, celestial ink, verdant moss, ember coal, coastal light, or steel-cage chrome.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {THEMES.map((t) => {
                  const m = META[t];
                  const Icon = m.Icon;
                  const active = theme === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition hover:scale-[1.03] ${
                        active ? "bg-glow text-primary-foreground shadow-glow" : "glass hover:shadow-glow"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 aspect-[3/4] rounded-2xl bg-dreamy animate-float" />
              <div className="flex-1 aspect-[3/4] rounded-2xl bg-glow shadow-glow animate-pulse-glow" />
              <div className="flex-1 aspect-[3/4] rounded-2xl bg-ink animate-float" style={{ animationDelay: "1.5s" }} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function FloatChip({ className, icon, label }: { className?: string; icon: React.ReactNode; label: string }) {
  return (
    <div className={`${className} animate-float`}>
      <div className="glass rounded-full px-3 py-1.5 text-xs flex items-center gap-1.5 shadow-soft">
        <span className="text-primary">{icon}</span> {label}
      </div>
    </div>
  );
}
