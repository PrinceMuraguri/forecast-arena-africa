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

const POLL_LIST_COLS =
  "id, slug, title, summary, description, question, status, country_code, kind, est_minutes, completion_reward_kes, reward_kes, respondent_count, sponsor_name, opens_at, closes_at, preview_enabled, index_slug, category:categories(slug,name,color,icon)";

export const listPollsCatalogue = createServerFn({ method: "GET" })
  .inputValidator(
    (input: { category?: string; country?: string; kind?: string; q?: string } | undefined) =>
      input ?? {},
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    let q = sb
      .from("polls")
      .select(POLL_LIST_COLS)
      .in("status", ["open", "closed"])
      .order("opens_at", { ascending: false, nullsFirst: false });
    if (data.country) q = q.eq("country_code", data.country);
    if (data.kind) q = q.eq("kind", data.kind);
    if (data.q) q = q.ilike("title", `%${data.q}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    let result = rows ?? [];
    if (data.category) result = result.filter((r: any) => r.category?.slug === data.category);
    return result;
  });

export const getPollDetail = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: poll, error } = await sb
      .from("polls")
      .select("*, category:categories(slug,name,color,icon)")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!poll) return null;
    const { data: questions, error: qErr } = await sb
      .from("poll_questions")
      .select("id, prompt, question_type, sort_order, options:poll_question_options(id,label,value,sort_order)")
      .eq("poll_id", poll.id)
      .order("sort_order")
      .limit(3);
    if (qErr) throw new Error(qErr.message);
    return { ...poll, preview_questions: questions ?? [] };
  });

export type SearchHit = {
  kind: "article" | "poll" | "index" | "ranking" | "report";
  slug: string;
  title: string;
  subtitle?: string | null;
};

export const globalSearch = createServerFn({ method: "GET" })
  .inputValidator((input: { q: string }) => input)
  .handler(async ({ data }): Promise<SearchHit[]> => {
    const term = data.q.trim();
    if (term.length < 2) return [];
    const sb = publicClient();
    const like = `%${term}%`;
    const [articles, polls, indexes, rankings, reports] = await Promise.all([
      sb.from("articles").select("slug,title,dek").or(`title.ilike.${like},dek.ilike.${like}`).limit(5),
      sb.from("polls").select("slug,title,summary").in("status", ["open", "closed"]).or(`title.ilike.${like},summary.ilike.${like}`).limit(5),
      sb.from("indexes").select("slug,name,description").or(`name.ilike.${like},description.ilike.${like}`).limit(5),
      sb.from("rankings").select("slug,title,description").or(`title.ilike.${like},description.ilike.${like}`).limit(5),
      sb.from("reports").select("slug,title,summary").or(`title.ilike.${like},summary.ilike.${like}`).limit(5),
    ]);
    const hits: SearchHit[] = [];
    (articles.data ?? []).forEach((a: any) => hits.push({ kind: "article", slug: a.slug, title: a.title, subtitle: a.dek }));
    (polls.data ?? []).forEach((p: any) => hits.push({ kind: "poll", slug: p.slug, title: p.title, subtitle: p.summary }));
    (indexes.data ?? []).forEach((i: any) => hits.push({ kind: "index", slug: i.slug, title: i.name, subtitle: i.description }));
    (rankings.data ?? []).forEach((r: any) => hits.push({ kind: "ranking", slug: r.slug, title: r.title, subtitle: r.description }));
    (reports.data ?? []).forEach((r: any) => hits.push({ kind: "report", slug: r.slug, title: r.title, subtitle: r.summary }));
    return hits;
  });
