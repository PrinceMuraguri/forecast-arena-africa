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
import { useAuth } from "@/lib/auth-stub";
import { GoogleButton } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Start earning — Forecast Arena" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) void navigate({ to: "/dashboard" });
  }, [isAuthenticated, loading, navigate]);

  return (
    <SiteShell>
      <section className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-16">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Join the panel
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold">
            Your opinion has value. Your foresight pays.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Free to join · Paid straight to M-Pesa · Your data, your choice.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <GoogleButton label="Sign up with Google" />

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
              <EmailSignupForm />
            </TabsContent>
            <TabsContent value="phone" className="mt-4">
              <PhoneSignupForm />
            </TabsContent>
          </Tabs>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline">
            Log in →
          </Link>
        </p>
      </section>
    </SiteShell>
  );
}

function EmailSignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName },
          },
        });
        setBusy(false);
        if (error) toast.error(error.message);
        else toast.success("You're in.");
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">At least 8 characters.</p>
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}

function PhoneSignupForm() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"phone" | "otp">("phone");
  const [busy, setBusy] = useState(false);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizePhone(phone),
      options: { shouldCreateUser: true },
    });
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
    else toast.success("You're in.");
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
        {busy ? "Verifying…" : "Verify & continue"}
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
