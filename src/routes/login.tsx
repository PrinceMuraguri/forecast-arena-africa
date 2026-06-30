import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-stub";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — Forecast Arena" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      void navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, loading, navigate]);

  return (
    <SiteShell>
      <section className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
        <div>
          <h1 className="font-display text-3xl font-bold">Welcome back.</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to The Arena and pick up where you left off.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <GoogleButton label="Continue with Google" />

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Tabs defaultValue="email">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="phone">Phone</TabsTrigger>
            </TabsList>
            <TabsContent value="email" className="mt-4">
              <EmailLoginForm />
            </TabsContent>
            <TabsContent value="phone" className="mt-4">
              <PhoneLoginForm />
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          New here?{" "}
          <Link to="/signup" className="text-primary hover:underline">
            Start earning →
          </Link>
        </p>
      </section>
    </SiteShell>
  );
}

export function GoogleButton({ label }: { label: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      className="w-full"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const result = await lovable.auth.signInWithOAuth("google", {
          redirect_uri: window.location.origin,
        });
        if (result.error) {
          toast.error(result.error.message ?? "Google sign-in failed");
          setBusy(false);
        }
      }}
    >
      <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4" aria-hidden>
        <path
          fill="#EA4335"
          d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.2-5.5 4.2-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.4l2.6-2.5C16.7 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.5 0 9.2-3.9 9.2-9.4 0-.6-.1-1.1-.2-1.6H12z"
        />
      </svg>
      {label}
    </Button>
  );
}

function EmailLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setBusy(false);
        if (error) toast.error(error.message);
        else toast.success("Welcome back");
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
            Forgot?
          </Link>
        </div>
        <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

function PhoneLoginForm() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [busy, setBusy] = useState(false);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: normalizePhone(phone) });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Code sent");
      setStage("otp");
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: normalizePhone(phone),
      token: code,
      type: "sms",
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Welcome");
  }

  if (stage === "phone") {
    return (
      <form className="space-y-3" onSubmit={sendOtp}>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Mobile number</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            placeholder="+254 712 345 678"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">We'll text you a 6-digit code.</p>
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Sending…" : "Send code"}
        </Button>
      </form>
    );
  }

  return (
    <form className="space-y-4" onSubmit={verifyOtp}>
      <div className="space-y-2">
        <Label>Enter the 6-digit code</Label>
        <InputOTP maxLength={6} value={code} onChange={setCode}>
          <InputOTPGroup>
            {Array.from({ length: 6 }).map((_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      <Button type="submit" className="w-full" disabled={busy || code.length < 6}>
        {busy ? "Verifying…" : "Verify"}
      </Button>
      <button
        type="button"
        className="block w-full text-center text-xs text-muted-foreground hover:text-primary"
        onClick={() => setStage("phone")}
      >
        ← use a different number
      </button>
    </form>
  );
}

function normalizePhone(input: string) {
  const trimmed = input.replace(/\s+/g, "");
  if (trimmed.startsWith("+")) return trimmed;
  if (trimmed.startsWith("0")) return "+254" + trimmed.slice(1);
  return "+" + trimmed;
}
