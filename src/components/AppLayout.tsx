import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Moon, Sparkles, LayoutDashboard, Shirt, Wand2, UserRound, BookHeart, Layers3, Image as ImageIcon, Settings, Sun, Menu, X, LogOut, Leaf, Flame, Waves, Zap } from "lucide-react";
import { useState } from "react";
import { useStudio } from "@/lib/store";
import { cn } from "@/lib/utils";
import { CreditsPill } from "@/components/CreditsPill";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/closet", label: "Closet", icon: Shirt },
  { to: "/studio", label: "Styling Studio", icon: Wand2 },
  { to: "/models", label: "Models", icon: UserRound },
  { to: "/lookbook", label: "Lookbook", icon: BookHeart },
  { to: "/collections", label: "Collections", icon: Layers3 },
  { to: "/moodboards", label: "Moodboards", icon: ImageIcon },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { theme, setTheme, user, signOut } = useStudio();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const onSignOut = async () => { await signOut(); nav({ to: "/login" }); };

  return (
    <div className="min-h-screen relative">
      <div className="pointer-events-none fixed inset-0 stars" aria-hidden />
      <div className="pointer-events-none fixed inset-0 petals" aria-hidden />
      <div className="pointer-events-none fixed inset-0 leaves" aria-hidden />
      <div className="pointer-events-none fixed inset-0 theme-ornament theme-ornament-pastel" aria-hidden />
      <div className="pointer-events-none fixed inset-0 theme-ornament theme-ornament-astro" aria-hidden />
      <div className="pointer-events-none fixed inset-0 theme-ornament theme-ornament-nature" aria-hidden />
      <div className="pointer-events-none fixed inset-0 theme-ornament theme-ornament-flame" aria-hidden />
      <div className="pointer-events-none fixed inset-0 theme-ornament theme-ornament-ocean" aria-hidden />

      {/* Top bar (mobile) */}
      <header className="md:hidden sticky top-0 z-40 glass">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-glow shadow-glow grid place-items-center text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display text-lg tracking-tight">Virtual<span className="text-gradient"> Lookbook</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <CreditsPill />
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button onClick={() => setOpen((v) => !v)} aria-label="Menu" className="h-9 w-9 grid place-items-center rounded-full glass">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="px-3 pb-3 grid grid-cols-2 gap-2">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
                className={cn("flex items-center gap-2 rounded-xl px-3 py-2 glass text-sm",
                  path === n.to && "bg-glow text-primary-foreground shadow-glow")}>
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <div className="relative z-[1] flex">
        {/* Sidebar (desktop) */}
        <aside className="hidden md:flex md:w-52 lg:w-56 shrink-0 sticky top-0 h-screen flex-col gap-4 py-5 px-4 glass border-r">
          <div className="flex flex-col items-start gap-3 px-2 py-1">
            <div className="inline-flex flex-col items-center gap-3">
            <Link to="/" className="flex flex-col items-center gap-2">
              <span className="h-10 w-10 rounded-2xl bg-glow shadow-glow grid place-items-center text-primary-foreground animate-pulse-glow">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="leading-tight text-center">
                <div className="font-display text-xl">Virtual</div>
                <div className="text-gradient font-display text-xl -mt-1">Lookbook</div>
              </div>
            </Link>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Studio</span>
            <div className="flex flex-col items-center gap-2">
              <CreditsPill />
              <ThemeToggle theme={theme} setTheme={setTheme} />
            </div>
            </div>
          </div>

          <nav className="flex-1 flex flex-col gap-1 mt-1">
            {NAV.map((n) => {
              const active = path === n.to;
              return (
                <Link key={n.to} to={n.to}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                    active
                      ? "bg-glow text-primary-foreground shadow-glow"
                      : "hover:bg-accent/60 text-foreground/80"
                  )}>
                  <n.icon className={cn("h-4 w-4", active ? "" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className="font-medium">{n.label}</span>
                </Link>
              );
            })}
          </nav>

          {user ? (
            <div className="flex flex-col items-start gap-2">
              <button onClick={onSignOut} title="Sign out" aria-label="Sign out" className="h-8 w-8 grid place-items-center rounded-full glass hover:bg-accent">
                <LogOut className="h-3.5 w-3.5" />
              </button>
              <div className="rounded-2xl px-3 py-2 glass w-full min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground leading-tight">Signed in</div>
                <div className="text-xs truncate">{user.email}</div>
              </div>
            </div>
          ) : (
            <Link to="/login" className="rounded-2xl p-3 glass flex items-center justify-between gap-2 hover:shadow-glow transition-shadow">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Browsing as guest</div>
                <div className="text-xs truncate">Sign in to generate ✦</div>
              </div>
            </Link>
          )}
        </aside>

        <main className="flex-1 min-w-0">
          <div className="mx-auto max-w-7xl p-4 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

type ThemeKey = "pastel" | "astro" | "nature" | "flame" | "ocean" | "barbed";
const THEME_ORDER: ThemeKey[] = ["pastel", "astro", "nature", "flame", "ocean", "barbed"];
const THEME_META: Record<ThemeKey, { label: string; next: string; Icon: typeof Sun }> = {
  pastel: { label: "Pastel Princess", next: "Switch to Dark Astrology", Icon: Sun },
  astro:  { label: "Dark Astrology",  next: "Switch to Green Nature",   Icon: Moon },
  nature: { label: "Green Nature",    next: "Switch to Ember Flames",   Icon: Leaf },
  flame:  { label: "Ember Flames",    next: "Switch to Tidal Ocean",    Icon: Flame },
  ocean:  { label: "Tidal Ocean",     next: "Switch to Chrome Barbed",  Icon: Waves },
  barbed: { label: "Chrome Barbed",   next: "Switch to Pastel Princess", Icon: Zap },
};
function ThemeToggle({ theme, setTheme }: { theme: ThemeKey; setTheme: (t: ThemeKey) => void }) {
  const idx = THEME_ORDER.indexOf(theme);
  const next = THEME_ORDER[(idx + 1) % THEME_ORDER.length];
  const meta = THEME_META[theme];
  const Icon = meta.Icon;
  return (
    <button
      onClick={() => setTheme(next)}
      aria-label="Switch theme"
      className="h-9 px-3 rounded-full glass flex items-center gap-2 text-xs hover:shadow-glow transition-shadow"
      title={meta.next}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="font-medium">{meta.label}</span>
    </button>
  );
}
