import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listCountries } from "@/lib/insights.functions";

const STORAGE_KEY = "fa.country";

export function useCountry() {
  const [code, setCodeState] = useState<string>("KE");
  useEffect(() => {
    const stored = typeof window !== "undefined" && window.localStorage.getItem(STORAGE_KEY);
    if (stored) setCodeState(stored);
  }, []);
  const setCode = (c: string) => {
    setCodeState(c);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, c);
  };
  return { code, setCode };
}

export function CountrySelector() {
  const [open, setOpen] = useState(false);
  const { code, setCode } = useCountry();
  const { data: countries } = useQuery({
    queryKey: ["countries"],
    queryFn: () => listCountries(),
    staleTime: 5 * 60_000,
  });
  const current = countries?.find((c: any) => c.code === code);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-medium hover:border-primary">
        <span>{current?.flag_emoji ?? "🌍"}</span>
        <span>{current?.name ?? "Kenya"}</span>
        <span className="text-muted-foreground">▾</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-1">
        {(countries ?? []).map((c: any) => {
          const isLive = c.is_live;
          return (
            <button
              key={c.code}
              disabled={!isLive}
              onClick={() => {
                if (!isLive) return;
                setCode(c.code);
                setOpen(false);
              }}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${
                isLive
                  ? "hover:bg-muted"
                  : "cursor-not-allowed text-muted-foreground"
              } ${code === c.code ? "bg-muted" : ""}`}
              title={!isLive ? "Coming soon" : undefined}
            >
              <span className="flex items-center gap-2">
                <span>{c.flag_emoji}</span>
                <span>{c.name}</span>
              </span>
              {!isLive && <span className="text-[10px] uppercase">Soon</span>}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

export function NonLiveCountryBanner({ countryCode }: { countryCode?: string }) {
  const { data: countries } = useQuery({
    queryKey: ["countries"],
    queryFn: () => listCountries(),
    staleTime: 5 * 60_000,
  });
  if (!countryCode || countryCode === "KE") return null;
  const c = countries?.find((x: any) => x.code === countryCode);
  if (!c || c.is_live) return null;
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10">
      <div className="mx-auto max-w-5xl px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
        We're launching in <span className="font-semibold">{c.name}</span> soon —
        meanwhile, here's what Kenya is saying.
      </div>
    </div>
  );
}
