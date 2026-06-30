import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-stub";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Log in — Forecast Arena" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signInStub } = useAuth();
  return (
    <SiteShell>
      <section className="mx-auto flex max-w-md flex-col gap-6 px-4 py-20">
        <div>
          <h1 className="font-display text-3xl font-bold">Welcome back.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Real auth (Google · phone OTP · email) wires up in Phase 1.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <Button onClick={signInStub} className="w-full">
            Demo sign-in
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            New here?{" "}
            <Link to="/signup" className="text-primary hover:underline">
              Start earning →
            </Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
