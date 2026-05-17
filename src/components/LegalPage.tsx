import { ReactNode } from "react";
import { ThemedFrame } from "@/components/ThemedFrame";
import { Sparkles } from "lucide-react";

export function LegalPage({ title, kicker, updated, children }: { title: string; kicker?: string; updated: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-4 md:px-8 py-10 md:py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          {kicker ?? "Virtual Lookbook"}
        </div>
        <h1 className="font-display text-4xl md:text-6xl mt-3 tracking-tight">
          <span className="text-gradient">{title}</span>
        </h1>
        <p className="mt-3 text-xs text-muted-foreground">Last updated: {updated}</p>
      </div>
      <ThemedFrame>
        <article className="p-6 md:p-10 prose-legal">
          {children}
        </article>
      </ThemedFrame>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8 last:mb-0">
      <h2 className="font-display text-xl md:text-2xl mb-2">{title}</h2>
      <div className="text-sm md:text-[15px] leading-relaxed text-foreground/85 space-y-3">
        {children}
      </div>
      <div aria-hidden className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </section>
  );
}