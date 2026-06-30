import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export type AdminMarket = {
  id: string;
  slug: string;
  title: string;
  status: string;
  prize_pool_kes: number;
  closes_at: string | null;
  resolves_at: string | null;
  predictions_count: number;
  outcomes: { id: string; label: string; is_winning: boolean | null }[];
};

export const adminCheck = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    try {
      await assertAdmin(context.userId);
      return { isAdmin: true as const };
    } catch {
      return { isAdmin: false as const };
    }
  });

export const adminListMarkets = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminMarket[]> => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("markets")
      .select(
        `id, slug, title, status, prize_pool_kes, closes_at, resolves_at,
         outcomes:market_outcomes(id,label,is_winning,sort_order),
         predictions:predictions(count)`,
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []).map((m) => ({
      id: m.id,
      slug: m.slug,
      title: m.title,
      status: m.status,
      prize_pool_kes: Number(m.prize_pool_kes ?? 0),
      closes_at: m.closes_at,
      resolves_at: m.resolves_at,
      predictions_count:
        Array.isArray(m.predictions) && m.predictions[0]
          ? Number((m.predictions[0] as { count: number }).count ?? 0)
          : 0,
      outcomes: (m.outcomes ?? [])
        .slice()
        .sort(
          (a: { sort_order: number }, b: { sort_order: number }) =>
            a.sort_order - b.sort_order,
        )
        .map((o: { id: string; label: string; is_winning: boolean | null }) => ({
          id: o.id,
          label: o.label,
          is_winning: o.is_winning,
        })),
    }));
  });

export const adminResolveMarket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { marketId: string; winningOutcomeId: string; notes?: string }) => {
    if (!input?.marketId || !input?.winningOutcomeId) throw new Error("missing ids");
    return {
      marketId: input.marketId,
      winningOutcomeId: input.winningOutcomeId,
      notes: input.notes?.trim() || null,
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("resolve_market" as never, {
      p_market_id: data.marketId,
      p_winning_outcome_id: data.winningOutcomeId,
      p_resolution_notes: data.notes,
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export type AdminPayout = {
  id: string;
  user_id: string;
  amount_kes: number;
  mpesa_phone: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  profile: { display_name: string | null } | null;
};

export const adminListPayouts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminPayout[]> => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("payout_requests")
      .select(
        `id,user_id,amount_kes,mpesa_phone,status,admin_notes,created_at,
         profile:profiles!payout_requests_user_id_fkey(display_name)`,
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (data ?? []).map((p) => ({
      ...p,
      amount_kes: Number(p.amount_kes ?? 0),
      profile: Array.isArray(p.profile) ? (p.profile[0] ?? null) : (p.profile ?? null),
    })) as AdminPayout[];
  });

export const adminSetPayoutStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { payoutId: string; status: "pending" | "approved" | "paid" | "rejected"; notes?: string }) => {
      if (!input?.payoutId || !input?.status) throw new Error("missing fields");
      return { payoutId: input.payoutId, status: input.status, notes: input.notes?.trim() || null };
    },
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("set_payout_status" as never, {
      p_payout_id: data.payoutId,
      p_new_status: data.status,
      p_admin_notes: data.notes,
    } as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export type AdminCreateMarketInput = {
  categoryId: string | null;
  slug: string;
  title: string;
  question: string;
  summary?: string;
  prizePoolKes: number;
  sponsorName?: string;
  closesAt?: string | null;
  outcomes: string[]; // labels in order
  status: "draft" | "open";
};

export const adminCreateMarket = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AdminCreateMarketInput) => {
    if (!input?.slug || !input.title || !input.question) throw new Error("missing fields");
    const outcomes = (input.outcomes ?? []).map((s) => s.trim()).filter(Boolean);
    if (outcomes.length < 2) throw new Error("Provide at least 2 outcomes");
    if (!["draft", "open"].includes(input.status)) throw new Error("invalid status");
    return {
      categoryId: input.categoryId || null,
      slug: input.slug.trim().toLowerCase(),
      title: input.title.trim(),
      question: input.question.trim(),
      summary: input.summary?.trim() || null,
      prizePoolKes: Math.max(0, Number(input.prizePoolKes) || 0),
      sponsorName: input.sponsorName?.trim() || null,
      closesAt: input.closesAt || null,
      outcomes,
      status: input.status,
    };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: m, error } = await supabaseAdmin
      .from("markets")
      .insert({
        category_id: data.categoryId,
        slug: data.slug,
        title: data.title,
        question: data.question,
        summary: data.summary,
        prize_pool_kes: data.prizePoolKes,
        sponsor_name: data.sponsorName,
        closes_at: data.closesAt,
        status: data.status,
        opens_at: data.status === "open" ? new Date().toISOString() : null,
      })
      .select("id,slug")
      .single();
    if (error) throw new Error(error.message);

    const rows = data.outcomes.map((label, idx) => ({
      market_id: m.id,
      label,
      sort_order: idx,
      implied_probability: 1 / data.outcomes.length,
    }));
    const { error: oErr } = await supabaseAdmin.from("market_outcomes").insert(rows);
    if (oErr) throw new Error(oErr.message);
    return { id: m.id, slug: m.slug };
  });
