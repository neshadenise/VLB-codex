import { createFileRoute, Outlet, Link } from "@tanstack/react-router";

// Note: this layout no longer forces authentication. Guest visitors can browse
// the app (closet, studio, models, lookbook, etc.) but actions that would
// generate images or mutate per-user data check `user` at the call site and
// route guests to /login with a clear message.
export const Route = createFileRoute("/_authenticated")({
  component: () => <Outlet />,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <h1 className="font-display text-3xl">Not found</h1>
      <Link to="/" className="underline text-sm mt-4 inline-block">Home</Link>
    </div>
  ),
});
