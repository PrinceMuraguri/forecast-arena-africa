import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

const ARTICLE_COLS =
  "id, slug, title, dek, hero_image_url, body, author, byline, country_code, article_type, linked_poll_slug, linked_index_slug, linked_report_slug, sponsor_name, read_minutes, published_at, is_featured, is_sample, category:categories(slug,name,color,icon)";

const INDEX_COLS =
  "id, slug, name, description, methodology_note, source_standard, unit, country_code, latest_value, change_value, is_sample, sort_order, category:categories(slug,name,color,icon)";

const RANKING_COLS =
  "id, slug, title, description, methodology_note, country_code, sample_size, is_sample, published_at, category:categories(slug,name,color,icon)";

const REPORT_COLS =
  "id, slug, title, summary, contents, cover_url, sample_url, category_id, country_code, price_kes, access, is_sample, is_featured, published_at, category:categories(slug,name,color,icon)";

export const listThemes = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("categories")
    .select("id, slug, name, color, icon, sort_order, kind")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listCountries = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("countries")
    .select("code, name, flag_emoji, is_live, sort_order")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listFeaturedArticles = createServerFn({ method: "GET" })
  .inputValidator((input: { limit?: number } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: rows, error } = await sb
      .from("articles")
      .select(ARTICLE_COLS)
      .eq("is_featured", true)
      .order("published_at", { ascending: false })
      .limit(data.limit ?? 6);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listArticles = createServerFn({ method: "GET" })
  .inputValidator(
    (input: { category?: string; country?: string; limit?: number } | undefined) =>
      input ?? {},
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    let q = sb.from("articles").select(ARTICLE_COLS).order("published_at", { ascending: false });
    if (data.country) q = q.eq("country_code", data.country);
    if (data.limit) q = q.limit(data.limit);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    let result = rows ?? [];
    if (data.category) {
      result = result.filter((r: any) => r.category?.slug === data.category);
    }
    return result;
  });

export const getArticle = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: row, error } = await sb
      .from("articles")
      .select(ARTICLE_COLS)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const listIndexes = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("indexes")
    .select(INDEX_COLS)
    .order("sort_order");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getIndex = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: idx, error } = await sb
      .from("indexes")
      .select(INDEX_COLS)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!idx) return null;
    const { data: points, error: pErr } = await sb
      .from("index_points")
      .select("period, value")
      .eq("index_id", idx.id)
      .order("period");
    if (pErr) throw new Error(pErr.message);
    return { ...idx, points: points ?? [] };
  });

export const listRankings = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("rankings")
    .select(RANKING_COLS)
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getRanking = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: r, error } = await sb
      .from("rankings")
      .select(RANKING_COLS)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!r) return null;
    const { data: entries, error: eErr } = await sb
      .from("ranking_entries")
      .select("label, logo_url, score, rank, change")
      .eq("ranking_id", r.id)
      .order("rank");
    if (eErr) throw new Error(eErr.message);
    return { ...r, entries: entries ?? [] };
  });

export const listReports = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("reports")
    .select(REPORT_COLS)
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getReport = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const sb = publicClient();
    // Note: file_url intentionally omitted from public select; gated by purchase/login later.
    const { data: r, error } = await sb
      .from("reports")
      .select(REPORT_COLS)
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return r;
  });

export const listPodcast = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("podcast_episodes")
    .select(
      "id, slug, title, description, guest_name, guest_title, guest_org, audio_url, video_url, duration_label, linked_market_slug, published_at",
    )
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getDailyQuestion = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("daily_questions")
    .select("id, question, options, results, country_code, active_date, is_sample")
    .order("active_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
});
