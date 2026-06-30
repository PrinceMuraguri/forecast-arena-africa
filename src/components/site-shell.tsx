import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PartnerBar } from "@/components/partner-bar";
import { PageTransition } from "@/components/page-transition";
import { useAuth } from "@/lib/auth-stub";

const insightsLinks = [
  { to: "/insights", label: "Articles" },
  { to: "/insights", label: "Reports & Data" },
  { to: "/insights", label: "The Indexes" },
  { to: "/insights", label: "The Opportunity Podcast" },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <span className="font-display text-xl font-bold tracking-tight">
              Forecast Arena
            </span>
            <span className="hidden text-[10px] uppercase tracking-widest text-muted-foreground md:inline">
              Powered by Econsult Africa
            </span>
          </Link>

          {!isAuthenticated && (
            <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
              <Link to="/arena" className="hover:text-primary">The Arena</Link>
              <Link to="/how-it-works" className="hover:text-primary">How It Works</Link>
              <div className="group relative">
                <Link to="/insights" className="hover:text-primary">Insights</Link>
                <div className="invisible absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-lg border border-border bg-popover p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                  {insightsLinks.map((l) => (
                    <Link
                      key={l.label}
                      to={l.to}
                      className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
                    >
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
              <Link to="/for-sponsors" className="hover:text-primary">For Sponsors</Link>
            </nav>
          )}

          {isAuthenticated && (
            <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
              <Link to="/dashboard" className="hover:text-primary">Dashboard</Link>
              <Link to="/arena" className="hover:text-primary">The Arena</Link>
              <Link to="/insights" className="hover:text-primary">Insights</Link>
            </nav>
          )}

          <div className="hidden items-center gap-2 md:flex">
            {!isAuthenticated ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/signup">Start earning</Link>
                </Button>
              </>
            ) : (
              <Button asChild variant="outline" size="sm">
                <Link to="/wallet">Wallet</Link>
              </Button>
            )}
          </div>

          <button
            className="rounded-md p-2 md:hidden"
            onClick={() => setMobileOpen((s) => !s)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-border md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 text-sm font-medium">
              <Link to="/arena" className="rounded-md px-2 py-2 hover:bg-muted">The Arena</Link>
              <Link to="/how-it-works" className="rounded-md px-2 py-2 hover:bg-muted">How It Works</Link>
              <Link to="/insights" className="rounded-md px-2 py-2 hover:bg-muted">Insights</Link>
              <Link to="/for-sponsors" className="rounded-md px-2 py-2 hover:bg-muted">For Sponsors</Link>
              <Link to="/rewards" className="rounded-md px-2 py-2 hover:bg-muted">Rewards</Link>
              <div className="mt-2 flex gap-2">
                <Button asChild variant="ghost" size="sm" className="flex-1">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild size="sm" className="flex-1">
                  <Link to="/signup">Start earning</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        <PageTransition>{children}</PageTransition>
      </main>

      <SiteFooter />
    </div>
  );
}

function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-12">
        <div className="md:col-span-4">
          <h3 className="font-display text-lg font-semibold">Forecast Arena.</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Africa's Polls & Predictions Platform. Take surveys, get paid.
            Predict outcomes, earn when you're right.
          </p>
          <div className="mt-4">
            <PartnerBar variant="footer" />
          </div>
        </div>

        <FooterCol
          title="Platform"
          links={[
            ["The Arena", "/arena"],
            ["How It Works", "/how-it-works"],
            ["Take Surveys", "/arena"],
            ["Predictions", "/arena"],
            ["Rewards", "/rewards"],
            ["Leaderboard", "/arena"],
          ]}
        />
        <FooterCol
          title="Insights"
          links={[
            ["Articles", "/insights"],
            ["Reports & Data", "/insights"],
            ["The Indexes", "/insights"],
            ["The Opportunity Podcast", "/insights"],
          ]}
        />
        <FooterCol
          title="For Sponsors"
          links={[
            ["Sponsor a Poll", "/for-sponsors"],
            ["Product Catalogue", "/for-sponsors"],
            ["Become a Media Partner", "/for-sponsors"],
            ["Case Studies", "/for-sponsors"],
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            ["About", "/about"],
            ["Methodology", "/about"],
            ["Ethics & Trust", "/about"],
            ["Contact", "/about"],
          ]}
        />
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground">
          <div>
            © 2026 Forecast Arena · Powered by Econsult Africa · Official Media Partner:
            The Kenyan Wall Street
          </div>
          <div className="flex items-center gap-3">
            <span className="italic">Made in Nairobi, for Africa.</span>
            <span>· Payments by Paystack (M-Pesa)</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: ReadonlyArray<readonly [string, string]>;
}) {
  return (
    <div className="md:col-span-2">
      <h4 className="font-display text-sm font-semibold">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link to={href} className="hover:text-foreground">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
