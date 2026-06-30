import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set a new password — Forecast Arena" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <SiteShell>
      <section className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
        <div>
          <h1 className="font-display text-3xl font-bold">Set a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick something you'll remember.
          </p>
        </div>
        <form
          className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const { error } = await supabase.auth.updateUser({ password });
            setBusy(false);
            if (error) toast.error(error.message);
            else {
              toast.success("Password updated.");
              void navigate({ to: "/dashboard" });
            }
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">At least 8 characters.</p>
          </div>
          <Button type="submit" className="mt-4 w-full" disabled={busy}>
            {busy ? "Updating…" : "Update password"}
          </Button>
        </form>
      </section>
    </SiteShell>
  );
}
