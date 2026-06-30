import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Wallet, LogOut, User, Shield, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PartnerBar } from "@/components/partner-bar";
import { PageTransition } from "@/components/page-transition";
import { useAuth } from "@/lib/auth-stub";
import { adminCheck } from "@/lib/admin.functions";
import { getMySponsorOrgs } from "@/lib/sponsor.functions";

/**
 * The dark/electric "arena world" shell, for the logged-in app surface.
 * Wraps content in `.arena-world` to flip the design tokens to dark mode.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, signOut } = useAuth();
  const walletKes = 1240; // Wallet integration arrives in a later phase.
  const { data: admin } = useQuery({
    queryKey: ["admin-check"],
    queryFn: () => adminCheck(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const { data: sponsorOrgs } = useQuery({
    queryKey: ["my-sponsor-orgs"],
    queryFn: () => getMySponsorOrgs(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
  const hasSponsorOrg = (sponsorOrgs?.length ?? 0) > 0;

  return (
    <div className="arena-world flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-arena-night/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-3 text-white">
            <span className="font-display text-xl font-bold tracking-tight">
              Forecast Arena
            </span>
            <span className="hidden text-[10px] uppercase tracking-widest text-white/50 md:inline">
              The Arena
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-white/80 md:flex">
            <Link to="/dashboard" className="hover:text-live-cyan">Dashboard</Link>
            <Link to="/arena" className="hover:text-live-cyan">The Arena</Link>
            <Link to="/insights" className="hover:text-live-cyan">Insights</Link>
            {admin?.isAdmin && (
              <Link to="/admin" className="inline-flex items-center gap-1 text-forecast-gold hover:text-forecast-gold/80">
                <Shield className="h-3.5 w-3.5" /> Admin
              </Link>
            )}
            {hasSponsorOrg && (
              <Link to="/sponsor" className="inline-flex items-center gap-1 text-live-cyan hover:text-live-cyan/80">
                <Building2 className="h-3.5 w-3.5" /> Sponsor
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link to="/wallet">
                <Wallet className="mr-1.5 h-3.5 w-3.5 text-forecast-gold" />
                <span className="font-mono-data">
                  KES {walletKes.toLocaleString()}
                </span>
              </Link>
            </Button>

            {isAuthenticated ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void signOut()}
                className="text-white/70 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Button asChild variant="ghost" size="sm" className="text-white/70 hover:bg-white/10 hover:text-white">
                <Link to="/login">
                  <User className="mr-1.5 h-4 w-4" />
                  Sign in
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>

      <footer className="border-t border-white/10 bg-arena-night/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-white/60">
          <PartnerBar variant="footer" />
          <span>Resolves against official sources · Paystack (M-Pesa)</span>
        </div>
      </footer>
    </div>
  );
}
