import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Forecast Arena" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <SiteShell>
      <section className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
        <div>
          <h1 className="font-display text-3xl font-bold">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We'll email you a secure link to set a new one.
          </p>
        </div>
        <form
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
              redirectTo: `${window.location.origin}/reset-password`,
            });
            setBusy(false);
            if (error) toast.error(error.message);
            else {
              setSent(true);
              toast.success("Check your inbox.");
            }
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <Button type="submit" className="mt-4 w-full" disabled={busy || sent}>
            {sent ? "Link sent" : busy ? "Sending…" : "Send reset link"}
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">
              ← Back to sign in
            </Link>
          </p>
        </form>
      </section>
    </SiteShell>
  );
}
