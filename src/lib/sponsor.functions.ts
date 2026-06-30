import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SponsorOrg = {
  id: string;
  slug: string;
  name: string;
  kind: string;
  website: string | null;
  logo_url: string | null;
  role: string;
};

export type SponsorMarketStat = {
  id: string;
  slug: string;
  title: string;
  status: string;
  prize_pool_kes: number;
  closes_at: string | null;
  resolves_at: string | null;
  predictions_count: number;
  unique_participants: number;
  avg_confidence: number | null;
  outcomes: {
    id: string;
    label: string;
    implied_probability: number;
    is_winning: boolean | null;
  }[];
};

async function loadMemberships(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("organization_members")
    .select("role, organization:organizations(id, slug, name, kind, website, logo_url)")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((m) => m.organization)
    .map((m) => ({ role: m.role as string, org: m.organization! as {
      id: string; slug: string; name: string; kind: string; website: string | null; logo_url: string | null;
    } }));
}

export const getMySponsorOrgs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SponsorOrg[]> => {
    const rows = await loadMemberships(context.userId);
    return rows
      .filter((r) => r.org.kind === "sponsor")
      .map((r) => ({ ...r.org, role: r.role }));
  });

export const getSponsorMarkets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ orgSlug: z.string().min(1) }).parse(d))
  .handler(async ({ context, data }): Promise<SponsorMarketStat[]> => {
    const rows = await loadMemberships(context.userId);
    const allowed = rows.find((r) => r.org.slug === data.orgSlug);
    if (!allowed) throw new Error("Forbidden: not a member of this organization");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: markets, error } = await supabaseAdmin
      .from("markets")
      .select(
        `id, slug, title, status, prize_pool_kes, closes_at, resolves_at,
         outcomes:market_outcomes(id, label, implied_probability, is_winning, sort_order),
         predictions:predictions(confidence, user_id)`,
      )
      .eq("sponsor_org_id", allowed.org.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return (markets ?? []).map((m) => {
      const preds = (m.predictions ?? []) as { confidence: number; user_id: string }[];
      const unique = new Set(preds.map((p) => p.user_id)).size;
      const avg = preds.length
        ? preds.reduce((a, p) => a + Number(p.confidence), 0) / preds.length
        : null;
      return {
        id: m.id,
        slug: m.slug,
        title: m.title,
        status: m.status as string,
        prize_pool_kes: Number(m.prize_pool_kes ?? 0),
        closes_at: m.closes_at,
        resolves_at: m.resolves_at,
        predictions_count: preds.length,
        unique_participants: unique,
        avg_confidence: avg,
        outcomes: (m.outcomes ?? [])
          .slice()
          .sort(
            (a: { sort_order: number }, b: { sort_order: number }) =>
              a.sort_order - b.sort_order,
          )
          .map((o: {
            id: string; label: string; implied_probability: number; is_winning: boolean | null;
          }) => ({
            id: o.id,
            label: o.label,
            implied_probability: Number(o.implied_probability ?? 0),
            is_winning: o.is_winning,
          })),
      };
    });
  });
