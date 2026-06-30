import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Menu, Search } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PartnerBar } from "@/components/partner-bar";
import { PageTransition } from "@/components/page-transition";
import { useAuth } from "@/lib/auth-stub";
import { CommandPalette, useCommandPalette } from "@/components/command-palette";
import { CountrySelector } from "@/components/country-selector";
import { listThemes } from "@/lib/insights.functions";

const byType = [
  { to: "/insights", label: "Articles" },
  { to: "/indexes", label: "The Indexes" },
  { to: "/rankings", label: "Rankings" },
  { to: "/reports", label: "Reports & Data" },
  { to: "/podcast", label: "The Opportunity Podcast" },
] as const;

export function SiteShell({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { open: cmdOpen, setOpen: setCmdOpen } = useCommandPalette();
  const { data: themes } = useQuery({
    queryKey: ["themes"],
    queryFn: () => listThemes(),
    staleTime: 5 * 60_000,
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <CommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <span className="font-display text-xl font-bold tracking-tight">
              Forecast Arena
            </span>
            <span className="hidden text-[10px] uppercase tracking-widest text-muted-foreground lg:inline">
              Powered by Econsult Africa
            </span>
          </Link>

          {!isAuthenticated && (
            <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
              <Link to="/explore" className="hover:text-primary">Explore</Link>
              <Link to="/arena" className="hover:text-primary">The Arena</Link>
              <div className="group relative">
                <Link to="/insights" className="hover:text-primary">Insights</Link>
                <div className="invisible absolute left-1/2 top-full z-20 mt-2 w-[520px] -translate-x-1/2 rounded-xl border border-border bg-popover p-4 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        By type
                      </div>
                      <ul className="space-y-1">
                        {byType.map((l) => (
                          <li key={l.label}>
                            <Link
                              to={l.to}
                              className="block rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                            >
                              {l.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        By theme
                      </div>
                      <ul className="space-y-1">
                        {(themes ?? []).slice(0, 8).map((t: any) => (
                          <li key={t.id}>
                            <Link
                              to="/insights"
                              search={{ category: t.slug } as any}
                              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
                            >
                              <span>{t.icon}</span>
                              <span>{t.name}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <Link to="/how-it-works" className="hover:text-primary">How It Works</Link>
              <Link to="/for-sponsors" className="hover:text-primary">For Sponsors</Link>
            </nav>
          )}

          {isAuthenticated && (
            <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
              <Link to="/dashboard" className="hover:text-primary">Dashboard</Link>
              <Link to="/explore" className="hover:text-primary">Explore</Link>
              <Link to="/arena" className="hover:text-primary">The Arena</Link>
              <Link to="/insights" className="hover:text-primary">Insights</Link>
            </nav>
          )}

          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={() => setCmdOpen(true)}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-primary"
              aria-label="Search"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Search…</span>
              <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] lg:inline">⌘K</kbd>
            </button>
            <CountrySelector />
            {!isAuthenticated ? (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/signup">Join & earn</Link>
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
              <button
                onClick={() => {
                  setMobileOpen(false);
                  setCmdOpen(true);
                }}
                className="flex items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-muted"
              >
                <Search className="h-4 w-4" /> Search
              </button>
              <Link to="/explore" className="rounded-md px-2 py-2 hover:bg-muted">Explore</Link>
              <Link to="/arena" className="rounded-md px-2 py-2 hover:bg-muted">The Arena</Link>
              <Link to="/insights" className="rounded-md px-2 py-2 hover:bg-muted">Insights</Link>
              <Link to="/indexes" className="rounded-md px-2 py-2 pl-5 text-muted-foreground hover:bg-muted">· The Indexes</Link>
              <Link to="/rankings" className="rounded-md px-2 py-2 pl-5 text-muted-foreground hover:bg-muted">· Rankings</Link>
              <Link to="/reports" className="rounded-md px-2 py-2 pl-5 text-muted-foreground hover:bg-muted">· Reports & Data</Link>
              <Link to="/podcast" className="rounded-md px-2 py-2 pl-5 text-muted-foreground hover:bg-muted">· The Opportunity</Link>
              <Link to="/how-it-works" className="rounded-md px-2 py-2 hover:bg-muted">How It Works</Link>
              <Link to="/for-sponsors" className="rounded-md px-2 py-2 hover:bg-muted">For Sponsors</Link>
              <Link to="/rewards" className="rounded-md px-2 py-2 hover:bg-muted">Rewards</Link>
              <div className="mt-2 px-2">
                <CountrySelector />
              </div>
              <div className="mt-2 flex gap-2">
                <Button asChild variant="ghost" size="sm" className="flex-1">
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="flex-1">
                  <Link to="/signup">Join & earn</Link>
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
            ["Explore polls", "/explore"],
            ["How It Works", "/how-it-works"],
            ["Rewards", "/rewards"],
          ]}
        />
        <FooterCol
          title="Insights"
          links={[
            ["Articles", "/insights"],
            ["The Indexes", "/indexes"],
            ["Rankings", "/rankings"],
            ["Reports & Data", "/reports"],
            ["The Opportunity Podcast", "/podcast"],
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
