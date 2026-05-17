import { Link } from "@tanstack/react-router";

export function GlobalFooter() {
  return (
    <footer className="mt-12 border-t border-border/40 bg-background/60 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 md:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="font-display tracking-wide">
          © {new Date().getFullYear()} Virtual<span className="text-gradient"> Lookbook</span>
        </div>
        <nav className="flex items-center gap-5">
          <Link
            to="/privacy"
            className="relative transition-colors hover:text-foreground after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-0 after:bg-gradient-to-r after:from-primary after:to-primary/40 after:transition-all hover:after:w-full hover:[text-shadow:0_0_12px_hsl(var(--primary)/0.5)]"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms"
            className="relative transition-colors hover:text-foreground after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-0 after:bg-gradient-to-r after:from-primary after:to-primary/40 after:transition-all hover:after:w-full hover:[text-shadow:0_0_12px_hsl(var(--primary)/0.5)]"
          >
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  );
}