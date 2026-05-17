import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useStudio } from "@/lib/store";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loadingAuth } = useStudio();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });

  useEffect(() => {
    if (loadingAuth || user) return;
    const redirect = pathname + searchStr;
    navigate({ to: "/login", search: { redirect } });
  }, [user, loadingAuth, navigate, pathname, searchStr]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen grid place-items-center" role="status" aria-busy="true">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (!user) return null;

  return <Outlet />;
}
