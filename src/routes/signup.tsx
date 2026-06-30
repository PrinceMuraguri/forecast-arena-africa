import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-stub";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [{ title: "Start earning — Forecast Arena" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { signInStub } = useAuth();
  return (
    <SiteShell>
      <section className="mx-auto flex max-w-md flex-col gap-6 px-4 py-20">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Join the panel
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold">
            Your opinion has value. Your foresight pays.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Free to join · Paid straight to M-Pesa · Your data, your choice. Real
            signup (Google · phone OTP · email) wires up in Phase 1.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <Button onClick={signInStub} className="w-full">
            Demo signup
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Log in →
            </Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
