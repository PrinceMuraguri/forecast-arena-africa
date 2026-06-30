import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { globalSearch } from "@/lib/explore.functions";

const KIND_LABEL: Record<string, string> = {
  article: "Articles",
  poll: "Polls",
  index: "Indexes",
  ranking: "Rankings",
  report: "Reports",
};

const KIND_PATH: Record<string, string> = {
  article: "/insights",
  poll: "/polls",
  index: "/indexes",
  ranking: "/rankings",
  report: "/reports",
};

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const { data: hits } = useQuery({
    queryKey: ["search", q],
    queryFn: () => globalSearch({ data: { q } }),
    enabled: q.trim().length >= 2,
    staleTime: 30_000,
  });

  const grouped = useMemo(() => {
    const g: Record<string, typeof hits> = {};
    (hits ?? []).forEach((h) => {
      (g[h.kind] ||= [] as any).push(h);
    });
    return g;
  }, [hits]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  function go(kind: string, slug: string) {
    onOpenChange(false);
    const base = KIND_PATH[kind] ?? "/";
    navigate({ to: `${base}/$slug`, params: { slug } } as any);
  }

  function submitAll() {
    onOpenChange(false);
    navigate({ to: "/search", search: { q } } as any);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search articles, polls, indexes, rankings, reports…"
        value={q}
        onValueChange={setQ}
        onKeyDown={(e) => {
          if (e.key === "Enter" && q.trim().length >= 2 && (!hits || hits.length === 0)) {
            submitAll();
          }
        }}
      />
      <CommandList>
        {q.trim().length < 2 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Type at least 2 characters to search.
          </div>
        )}
        {q.trim().length >= 2 && (!hits || hits.length === 0) && (
          <CommandEmpty>No matches. Press Enter to view full results.</CommandEmpty>
        )}
        {Object.entries(grouped).map(([kind, items]) => (
          <CommandGroup key={kind} heading={KIND_LABEL[kind] ?? kind}>
            {items!.map((h) => (
              <CommandItem
                key={`${kind}-${h.slug}`}
                value={`${kind}-${h.slug}-${h.title}`}
                onSelect={() => go(kind, h.slug)}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{h.title}</span>
                  {h.subtitle && (
                    <span className="line-clamp-1 text-xs text-muted-foreground">
                      {h.subtitle}
                    </span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        {hits && hits.length > 0 && (
          <CommandGroup>
            <CommandItem onSelect={submitAll} value="__all__">
              <span className="text-primary">See all results for "{q}" →</span>
            </CommandItem>
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  return { open, setOpen };
}
