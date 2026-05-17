import { toast } from "sonner";

/**
 * Returns true if a user is signed in. If not, shows a toast and (optionally)
 * triggers the sign-in flow. Use at the top of any handler that performs an
 * image generation or other authenticated mutation.
 */
export function requireSignIn(user: { id: string } | null | undefined, action = "generate"): user is { id: string } {
  if (user) return true;
  toast.error("Sign in to " + action, {
    description: "Create a free account to generate images and save your work.",
    action: {
      label: "Sign in",
      onClick: () => {
        const redirect = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/";
        window.location.href = "/login?redirect=" + encodeURIComponent(redirect);
      },
    },
    duration: 8000,
  });
  return false;
}
