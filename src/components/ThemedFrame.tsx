import { cn } from "@/lib/utils";
import { useStudio } from "@/lib/store";
import type { CSSProperties, ReactNode } from "react";

export type ThemeKey = "pastel" | "astro" | "nature" | "flame" | "ocean" | "barbed";

export const THEME_LABELS: Record<ThemeKey, string> = {
  pastel: "Pastel Princess",
  astro: "Dark Astrology",
  nature: "Green Nature",
  flame: "Ember Flames",
  ocean: "Tidal Ocean",
  barbed: "Chrome Barbed",
};

const DECOR_CLASS: Record<ThemeKey, string> = {
  ocean: "themed-frame-ocean",
  flame: "themed-frame-flame",
  nature: "themed-frame-nature",
  astro: "themed-frame-astro",
  pastel: "themed-frame-pastel",
  barbed: "themed-frame-barbed",
};

// Theme-specific corner ornament (tiny SVG, fixed pixel size — never stretches).
function CornerOrnament({ theme }: { theme: ThemeKey }) {
  const common = "absolute h-4 w-4 pointer-events-none drop-shadow-[0_0_6px_currentColor]";
  let glyph: ReactNode = null;
  switch (theme) {
    case "pastel":
      glyph = (
        <svg viewBox="0 0 16 16" className="h-full w-full text-pink-300">
          <path d="M8 2 L9.5 6 L14 6.5 L10.5 9 L11.5 13.5 L8 11 L4.5 13.5 L5.5 9 L2 6.5 L6.5 6 Z" fill="currentColor" />
        </svg>
      );
      break;
    case "astro":
      glyph = (
        <svg viewBox="0 0 16 16" className="h-full w-full text-indigo-200">
          <path d="M11 3 a5 5 0 1 0 0 10 a4 4 0 1 1 0 -10 z" fill="currentColor" />
        </svg>
      );
      break;
    case "nature":
      glyph = (
        <svg viewBox="0 0 16 16" className="h-full w-full text-emerald-300">
          <path d="M2 14 C 2 6, 8 2, 14 2 C 14 10, 9 14, 2 14 z" fill="currentColor" />
        </svg>
      );
      break;
    case "flame":
      glyph = (
        <svg viewBox="0 0 16 16" className="h-full w-full text-orange-400">
          <path d="M8 1 C 6 5, 11 6, 9 9 C 13 8, 13 14, 8 15 C 3 14, 3 8, 7 9 C 5 6, 8 4, 8 1 z" fill="currentColor" />
        </svg>
      );
      break;
    case "ocean":
      glyph = (
        <svg viewBox="0 0 16 16" className="h-full w-full text-sky-300">
          <path d="M8 2 L13 8 C 13 12, 10 14, 8 14 C 6 14, 3 12, 3 8 z M8 4 L6 8 M8 4 L10 8 M8 4 L8 13" stroke="currentColor" strokeWidth={0.8} fill="currentColor" fillOpacity={0.4} />
        </svg>
      );
      break;
    case "barbed":
      glyph = (
        <svg viewBox="0 0 16 16" className="h-full w-full text-slate-200">
          <defs>
            <linearGradient id="bw-chrome" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#e8eef4" />
              <stop offset="50%" stopColor="#7a8390" />
              <stop offset="100%" stopColor="#cfd6df" />
            </linearGradient>
          </defs>
          <circle cx="8" cy="8" r="3" fill="url(#bw-chrome)" stroke="#3a4150" strokeWidth="0.6" />
          <path d="M8 1 L8 4 M8 12 L8 15 M1 8 L4 8 M12 8 L15 8 M3 3 L5 5 M11 11 L13 13 M13 3 L11 5 M3 13 L5 11" stroke="url(#bw-chrome)" strokeWidth="1.1" strokeLinecap="round" />
        </svg>
      );
      break;
  }
  return (
    <>
      <div className={cn(common, "top-0 left-0")} aria-hidden>{glyph}</div>
      <div className={cn(common, "top-0 right-0")} aria-hidden>{glyph}</div>
      <div className={cn(common, "bottom-0 left-0")} aria-hidden>{glyph}</div>
      <div className={cn(common, "bottom-0 right-0")} aria-hidden>{glyph}</div>
    </>
  );
}

export function ThemedFrame({
  children,
  className,
  theme,
  style,
}: { children: ReactNode; className?: string; theme?: ThemeKey; style?: CSSProperties }) {
  const { theme: activeTheme } = useStudio();
  const t = (theme ?? (activeTheme as ThemeKey)) || "pastel";

  return (
    <div
      className={cn("relative themed-frame", DECOR_CLASS[t], className)}
      style={style}
    >
      {/* Decorative perforated/cutout border — purely CSS, sits outside the content. */}
      <div className="themed-frame-border" aria-hidden />
      {/* Corner ornaments */}
      <CornerOrnament theme={t} />
      {/* Rectangular safe content area */}
      <div className="themed-frame-content relative z-[1] rounded-2xl bg-card/95 border border-border/50 backdrop-blur-sm shadow-sm">
        {children}
      </div>
    </div>
  );
}
