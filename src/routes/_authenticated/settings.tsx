import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppLayout } from "@/components/AppLayout";
import { useStudio } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Moon, Sun, Trash2, Download, Leaf, Heart, Instagram, Shield, UserPlus, UserMinus, Flame, Waves, Sparkles, Crown, Zap } from "lucide-react";
import { verifyCheckout } from "@/lib/stripe.functions";
import { grantAdminByEmail, revokeAdminByEmail, listAdmins, amIMasterAdmin } from "@/lib/admin.functions";
import { getMyRole } from "@/lib/credits.functions";
import { CreditPackManager } from "@/components/CreditPackManager";
import { ThemedFrame } from "@/components/ThemedFrame";
import { MasterAdminSecurity } from "@/components/MasterAdminSecurity";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings · Virtual Lookbook" },
      { name: "description", content: "Account, theme, and credit settings for your Virtual Lookbook studio." },
      { property: "og:title", content: "Settings · Virtual Lookbook" },
      { property: "og:description", content: "Account, theme, and credit settings for your Virtual Lookbook studio." },
      { property: "og:url", content: "https://virtuallookbookpro.lovable.app/settings" },
    ],
    links: [{ rel: "canonical", href: "https://virtuallookbookpro.lovable.app/settings" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme, items, looks, collections, moodboards } = useStudio();
  const verify = useServerFn(verifyCheckout);

  useEffect(() => {
    const url = new URL(window.location.href);
    const purchase = url.searchParams.get("purchase");
    const sessionId = url.searchParams.get("session_id");
    if (purchase === "cancelled") {
      toast.info("Checkout cancelled");
      url.searchParams.delete("purchase");
      window.history.replaceState({}, "", url.pathname + url.search);
      return;
    }
    if (purchase === "success" && sessionId) {
      verify({ data: { sessionId } }).then((r: any) => {
        if (r?.ok && r.status === "completed") toast.success(`+${r.credits} credits added ✦`);
        else if (r?.status === "completed") toast.success("Credits already added");
        else toast.info("Payment is processing — credits will appear shortly");
      }).catch((e) => toast.error(e?.message || "Could not verify purchase"));
      url.searchParams.delete("purchase");
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [verify]);

  const exportAll = () => {
    const blob = new Blob([JSON.stringify({ items, looks, collections, moodboards }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "style-doll-studio.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported ✦");
  };

  const wipe = () => {
    if (!confirm("Reset local theme preferences and reload? Your synced cloud data is safe.")) return;
    localStorage.removeItem("sds:v1"); location.reload();
  };

  return (
    <AppLayout>
      <header className="mb-6">
        <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Studio preferences</div>
        <h1 className="font-display text-4xl md:text-5xl">Settings</h1>
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <Section title="Theme" desc="Pick your vibe — Pastel Princess, Dark Astrology, Green Nature, Ember Flames, or Tidal Ocean." theme={theme}>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {THEME_CARDS.map((t) => {
              const Icon = t.icon;
              const active = theme === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTheme(t.key)}
                  className={`rounded-2xl p-3 text-left transition-all min-w-0 ${active ? "bg-glow text-primary-foreground shadow-glow scale-[1.02]" : "glass hover:shadow-glow"}`}
                  aria-pressed={active}
                >
                  <Icon className="h-4 w-4" />
                  <div className="font-display text-sm sm:text-base mt-2 leading-tight break-words">{t.label}</div>
                  <div className="text-[11px] opacity-80 leading-snug break-words">{t.desc}</div>
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="Storage" desc="Your studio travels with your account — looks, closets, models, collections, and settings sync across every device after sign-in. Private to you, per authenticated account." theme={theme}>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>{items.length} closet items</li>
            <li>{looks.length} saved looks</li>
            <li>{collections.length} collections</li>
            <li>{moodboards.length} moodboards</li>
          </ul>
          <div className="mt-3 flex gap-2 flex-wrap">
            <Button variant="outline" onClick={exportAll}><Download className="h-4 w-4 mr-1" /> Export JSON</Button>
            <Button variant="destructive" onClick={wipe}><Trash2 className="h-4 w-4 mr-1" /> Reset local prefs</Button>
          </div>
        </Section>

        <div className="md:col-span-2">
          <AdminSection />
          <MasterAdminSecurity />
        </div>

        <MasterOnlyPackManager />

        <div className="md:col-span-2">
          <Section title="A NOTE FROM THE CREATOR" desc="Why this studio exists." theme={theme} emphasizeTitle>
            <div className="space-y-3 text-sm leading-relaxed text-foreground/80">
              <p>
                I wanted to build an app for fashion lovers that everyone can use. Create looks from
                items you find online, or upload pictures of the pieces you already own at home.
              </p>
              <p>
                This app is made to be inclusive, with support for amputees, little people, wheelchair
                users, mobility aids, and more — because everyone should be able to see themselves
                <span className="font-display italic"> IN STYLE.</span>
              </p>
              <p className="font-display text-xl tracking-wide text-primary">
                Be YOU. Be FIERCE.
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-border/60 flex items-center gap-3 flex-wrap">
              <Heart className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Made by</span>
              <a
                href="https://www.instagram.com/wrestlegirlnesh"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full glass px-3 py-1.5 text-sm font-medium hover:shadow-glow transition group"
                title="Follow @wrestlegirlnesh on Instagram"
              >
                <span className="h-7 w-7 grid place-items-center rounded-full bg-glow text-primary-foreground shadow-glow group-hover:scale-105 transition-transform">
                  <Instagram className="h-4 w-4" />
                </span>
                <span>@wrestlegirlnesh</span>
              </a>
            </div>
          </Section>
        </div>
      </div>
    </AppLayout>
  );
}

type ThemeKey = "pastel" | "astro" | "nature" | "flame" | "ocean" | "barbed";
const THEME_CARDS: { key: ThemeKey; label: string; desc: string; icon: typeof Sun }[] = [
  { key: "pastel", label: "Pastel Princess", desc: "Lavender · Blush · Sparkle", icon: Sparkles },
  { key: "astro",  label: "Dark Astrology",  desc: "Celestial · Silver · Navy", icon: Moon },
  { key: "nature", label: "Green Nature",    desc: "Moss · Leaf · Sunlight",    icon: Leaf },
  { key: "flame",  label: "Ember Flames",          desc: "Ember · Crimson · Gold",    icon: Flame },
  { key: "ocean",  label: "Tidal Ocean",           desc: "Wave · Teal · Foam",        icon: Waves },
  { key: "barbed", label: "Chrome Barbed",         desc: "Steel · Wire · Arena",      icon: Zap },
];

const THEME_DECOR: Record<ThemeKey, { icon: typeof Sun; ring: string }> = {
  pastel: { icon: Sparkles, ring: "from-pink-300/40 via-purple-300/30 to-transparent" },
  astro:  { icon: Moon,     ring: "from-indigo-400/40 via-slate-300/20 to-transparent" },
  nature: { icon: Leaf,     ring: "from-emerald-400/40 via-lime-300/20 to-transparent" },
  flame:  { icon: Flame,    ring: "from-orange-400/50 via-rose-400/30 to-transparent" },
  ocean:  { icon: Waves,    ring: "from-sky-400/40 via-cyan-300/20 to-transparent" },
  barbed: { icon: Zap,      ring: "from-slate-200/40 via-zinc-400/30 to-transparent" },
};

function Section({ title, desc, children, theme = "pastel", emphasizeTitle = false }: { title: string; desc: string; children: React.ReactNode; theme?: ThemeKey; emphasizeTitle?: boolean }) {
  return (
    <ThemedFrame theme={theme}>
      <div className="p-6">
        <h2 className={`font-display ${emphasizeTitle ? "text-3xl tracking-wider text-gradient" : "text-2xl"}`}>{title}</h2>
        <p className="text-sm text-muted-foreground mb-4">{desc}</p>
        {children}
      </div>
    </ThemedFrame>
  );
}

function MasterOnlyPackManager() {
  const checkMaster = useServerFn(amIMasterAdmin);
  const [isMaster, setIsMaster] = useState(false);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    (async () => {
      try { const r: any = await checkMaster(); setIsMaster(!!r?.isMaster); } catch {}
      setChecked(true);
    })();
  }, [checkMaster]);
  if (!checked || !isMaster) return null;
  return <div className="md:col-span-2"><CreditPackManager /></div>;
}

function AdminSection() {
  const getRole = useServerFn(getMyRole);
  const grant = useServerFn(grantAdminByEmail);
  const revoke = useServerFn(revokeAdminByEmail);
  const list = useServerFn(listAdmins);
  const checkMaster = useServerFn(amIMasterAdmin);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMaster, setIsMaster] = useState(false);
  const [checked, setChecked] = useState(false);
  const [admins, setAdmins] = useState<{ user_id: string; email: string; created_at: string }[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const r: any = await list();
    if (r?.error) { toast.error(r.error); return; }
    setAdmins(r?.admins ?? []);
  }, [list]);

  useEffect(() => {
    (async () => {
      try {
        const r: any = await getRole();
        const admin = !!r?.isAdmin;
        setIsAdmin(admin);
        setChecked(true);
        if (admin) {
          await refresh();
          try {
            const m: any = await checkMaster();
            setIsMaster(!!m?.isMaster);
          } catch { /* ignore */ }
        }
      } catch { setChecked(true); }
    })();
  }, [getRole, refresh, checkMaster]);

  if (!checked || !isAdmin) return null;

  const onGrant = async () => {
    const e = email.trim();
    if (!e) { toast.error("Enter an email"); return; }
    setBusy(true);
    try {
      const r: any = await grant({ data: { email: e } });
      if (r?.error) {
        const msg = String(r.error);
        if (msg.includes("USER_NOT_FOUND")) toast.error("No account with that email — ask them to sign up first.");
        else if (msg.includes("NOT_MASTER_ADMIN")) toast.error("Only the master admin can grant admin.");
        else toast.error(msg);
      } else {
        toast.success(`${e} is now an admin ✦`);
        setEmail("");
        await refresh();
      }
    } finally { setBusy(false); }
  };

  const onRevoke = async (e: string) => {
    if (!confirm(`Revoke admin from ${e}?`)) return;
    setBusy(true);
    try {
      const r: any = await revoke({ data: { email: e } });
      if (r?.error) {
        const msg = String(r.error);
        if (msg.includes("CANNOT_REVOKE_MASTER")) toast.error("The master admin cannot be revoked.");
        else if (msg.includes("NOT_MASTER_ADMIN")) toast.error("Only the master admin can revoke admins.");
        else toast.error(msg);
      } else {
        toast.success(`Admin revoked from ${e}`);
        await refresh();
      }
    } finally { setBusy(false); }
  };

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-1">
        {isMaster ? <Crown className="h-5 w-5 text-primary" /> : <Shield className="h-5 w-5 text-primary" />}
        <h2 className="font-display text-2xl">{isMaster ? "Master admin" : "Admin access"}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {isMaster
          ? "You're the master admin. You can promote or revoke other admins by email. Admins get unlimited generations."
          : "You're an admin — you have unlimited generations. Only the master admin can add or revoke other admins."}
      </p>
      {isMaster && (
      <div className="flex gap-2 flex-wrap">
        <Input
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onGrant(); }}
          className="flex-1 min-w-[220px]"
          disabled={busy}
        />
        <Button onClick={onGrant} disabled={busy || !email.trim()} className="bg-glow text-primary-foreground shadow-glow">
          <UserPlus className="h-4 w-4 mr-1" /> Grant admin
        </Button>
      </div>
      )}
      <div className="mt-5">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Current admins ({admins.length})</div>
        <ul className="divide-y divide-border/60 rounded-2xl glass overflow-hidden">
          {admins.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">None yet.</li>}
          {admins.map((a) => (
            <li key={a.user_id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate flex items-center gap-1.5">
                  {a.email.toLowerCase() === "neshadenise@gmail.com" && <Crown className="h-3.5 w-3.5 text-primary" />}
                  {a.email}
                </div>
                <div className="text-[10px] text-muted-foreground">since {new Date(a.created_at).toLocaleDateString()}</div>
              </div>
              {isMaster && a.email.toLowerCase() !== "neshadenise@gmail.com" && (
                <Button size="sm" variant="outline" disabled={busy} onClick={() => onRevoke(a.email)}
                  aria-label={`Revoke admin from ${a.email}`}>
                  <UserMinus className="h-3.5 w-3.5 mr-1" /> Revoke
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
