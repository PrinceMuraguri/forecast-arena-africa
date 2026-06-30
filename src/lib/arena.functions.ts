import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  );
}

export type ArenaMarketOutcome = {
  id: string;
  label: string;
  implied_probability: number;
  sort_order: number;
};

export type ArenaMarket = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  question: string;
  status: string;
  opens_at: string | null;
  closes_at: string | null;
  resolves_at: string | null;
  sponsor_name: string | null;
  prize_pool_kes: number;
  category: { slug: string; name: string; color: string | null } | null;
  outcomes: ArenaMarketOutcome[];
};

export const listArenaMarkets = createServerFn({ method: "GET" }).handler(
  async (): Promise<ArenaMarket[]> => {
    const sb = publicClient();
    const { data, error } = await sb
      .from("markets")
      .select(
        `id, slug, title, summary, question, status, opens_at, closes_at, resolves_at,
         sponsor_name, prize_pool_kes,
         category:categories(slug,name,color),
         outcomes:market_outcomes(id,label,implied_probability,sort_order)`,
      )
      .in("status", ["open", "closed", "resolved"])
      .order("closes_at", { ascending: true, nullsFirst: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []).map((m) => ({
      ...m,
      prize_pool_kes: Number(m.prize_pool_kes ?? 0),
      outcomes: (m.outcomes ?? [])
        .map((o) => ({
          ...o,
          implied_probability: Number(o.implied_probability ?? 0),
        }))
        .sort((a, b) => a.sort_order - b.sort_order),
    })) as ArenaMarket[];
  },
);

export type ArenaPoll = {
  id: string;
  slug: string;
  title: string;
  question: string;
  summary: string | null;
  status: string;
  opens_at: string | null;
  closes_at: string | null;
  sponsor_name: string | null;
  category: { slug: string; name: string; color: string | null } | null;
};

export const listInsightsPolls = createServerFn({ method: "GET" }).handler(
  async (): Promise<ArenaPoll[]> => {
    const sb = publicClient();
    const { data, error } = await sb
      .from("polls")
      .select(
        `id, slug, title, question, summary, status, opens_at, closes_at, sponsor_name,
         category:categories(slug,name,color)`,
      )
      .in("status", ["open", "closed"])
      .order("closes_at", { ascending: true, nullsFirst: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return (data ?? []) as ArenaPoll[];
  },
);

export type ArenaCategory = {
  id: string;
  slug: string;
  name: string;
  color: string | null;
};

export const listCategories = createServerFn({ method: "GET" }).handler(
  async (): Promise<ArenaCategory[]> => {
    const sb = publicClient();
    const { data, error } = await sb
      .from("categories")
      .select("id,slug,name,color")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as ArenaCategory[];
  },
);
