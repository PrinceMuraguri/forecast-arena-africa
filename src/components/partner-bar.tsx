import { cn } from "@/lib/utils";
import econsultAsset from "@/assets/econsult-africa-logo.png.asset.json";
import tkwsAsset from "@/assets/kenyan-wallstreet-logo.jpg.asset.json";

const ECONSULT_LOGO = econsultAsset.url;
const TKWS_LOGO = tkwsAsset.url;

function EconsultMark({ className }: { className?: string }) {
  return (
    <img
      src={ECONSULT_LOGO}
      alt="Econsult Africa"
      className={cn("inline-block h-4 w-auto align-[-3px]", className)}
      loading="lazy"
    />
  );
}

function TkwsMark({ className }: { className?: string }) {
  return (
    <img
      src={TKWS_LOGO}
      alt="The Kenyan Wall Street"
      className={cn("inline-block h-4 w-4 rounded-full align-[-3px]", className)}
      loading="lazy"
    />
  );
}

type Variant = "footer" | "poll" | "cobranded" | "partners" | "chip";

interface PartnerBarProps {
  variant?: Variant;
  sponsorName?: string;
  sponsorLogoUrl?: string;
  resolutionSource?: string;
  showTkws?: boolean;
  className?: string;
}

const ECONSULT_URL = "https://econsult.africa";
const TKWS_URL = "https://kenyanwallstreet.com";

export function PartnerBar({
  variant = "chip",
  sponsorName,
  sponsorLogoUrl,
  resolutionSource,
  showTkws = true,
  className,
}: PartnerBarProps) {
  if (variant === "footer") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground",
          className,
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <EconsultMark />
          Powered by{" "}
          <a className="font-medium text-foreground hover:text-primary" href={ECONSULT_URL}>
            Econsult Africa
          </a>
        </span>
        {showTkws && (
          <>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              <TkwsMark />
              Official Media Partner:{" "}
              <a className="font-medium text-foreground hover:text-primary" href={TKWS_URL}>
                The Kenyan Wall Street
              </a>
            </span>
          </>
        )}
      </div>
    );
  }

  if (variant === "partners") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm",
          className,
        )}
      >
        <span className="inline-flex items-center gap-2 font-medium">
          <EconsultMark className="h-6" />
          Powered by{" "}
          <a className="text-primary hover:underline" href={ECONSULT_URL}>
            Econsult Africa
          </a>
        </span>
        <span aria-hidden className="text-muted-foreground">·</span>
        <span className="inline-flex items-center gap-2 font-medium">
          <TkwsMark className="h-6 w-6" />
          Official Media Partner:{" "}
          <a className="text-primary hover:underline" href={TKWS_URL}>
            The Kenyan Wall Street
          </a>
        </span>
      </div>
    );
  }

  if (variant === "cobranded") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/50 px-3 py-2 text-xs",
          className,
        )}
      >
        <span className="font-display font-semibold">Forecast Arena</span>
        <Dot />
        <span className="inline-flex items-center gap-1.5"><EconsultMark />Powered by Econsult Africa</span>
        {showTkws && (
          <>
            <Dot />
            <span className="inline-flex items-center gap-1.5"><TkwsMark />Official Media Partner The Kenyan Wall Street</span>
          </>
        )}
        {sponsorName && (
          <>
            <Dot />{" "}
            <span className="flex items-center gap-1">
              Sponsored by
              {sponsorLogoUrl && (
                <img src={sponsorLogoUrl} alt="" className="h-4 w-auto" />
              )}
              <span className="font-medium text-foreground">{sponsorName}</span>
            </span>
          </>
        )}
        {resolutionSource && (
          <span className="ml-auto rounded-full border border-live-cyan/40 bg-live-cyan/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-live-cyan">
            Resolves against {resolutionSource}
          </span>
        )}
      </div>
    );
  }

  if (variant === "poll") {
    return (
      <div className={cn("flex flex-wrap items-center gap-2 text-xs", className)}>
        <Chip><EconsultMark className="mr-1 h-3" />Powered by Econsult Africa</Chip>
        {showTkws && <Chip><TkwsMark className="mr-1 h-3 w-3" />Media: The Kenyan Wall Street</Chip>}
        {sponsorName && <Chip accent>Sponsored by {sponsorName}</Chip>}
      </div>
    );
  }

  return <Chip className={className}>Powered by Econsult Africa</Chip>;
}

function Dot() {
  return <span aria-hidden className="text-muted-foreground">·</span>;
}

function Chip({
  children,
  accent,
  className,
}: {
  children: React.ReactNode;
  accent?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        accent
          ? "border-forecast-gold/40 bg-forecast-gold/10 text-forecast-gold"
          : "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}
