import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export type PollQuestion = {
  id: string;
  prompt: string;
  kind: "single" | "multi" | "scale" | "text";
  required: boolean;
  scale_min: number | null;
  scale_max: number | null;
  sort_order: number;
  options: { id: string; label: string; sort_order: number }[];
};

export type PollDetail = {
  id: string;
  slug: string;
  title: string;
  question: string;
  summary: string | null;
  status: string;
  closes_at: string | null;
  sponsor_name: string | null;
  reward_kes: number;
  category: { slug: string; name: string; color: string | null } | null;
  questions: PollQuestion[];
};

export const getPollBySlug = createServerFn({ method: "GET" })
  .inputValidator((i: { slug: string }) => {
    if (!i?.slug) throw new Error("slug required");
    return { slug: i.slug };
  })
  .handler(async ({ data }): Promise<PollDetail | null> => {
    const sb = publicClient();
    const { data: poll, error } = await sb
      .from("polls")
      .select(
        `id, slug, title, question, summary, status, closes_at, sponsor_name, reward_kes,
         category:categories(slug,name,color),
         questions:poll_questions(
           id, prompt, kind, required, scale_min, scale_max, sort_order,
           options:poll_question_options(id,label,sort_order)
         )`,
      )
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!poll) return null;
    const questions = ((poll.questions ?? []) as PollQuestion[])
      .map((q) => ({
        ...q,
        options: (q.options ?? []).sort((a, b) => a.sort_order - b.sort_order),
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
    return { ...(poll as unknown as PollDetail), questions };
  });

export type PollAnswerInput = {
  questionId: string;
  optionId?: string | null;
  optionIds?: string[];
  text?: string | null;
  value?: number | null;
};

export type SubmitPollResponseInput = {
  pollId: string;
  answers: PollAnswerInput[];
};

export const getMyPollResponse = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { pollId: string }) => {
    if (!i?.pollId) throw new Error("pollId required");
    return { pollId: i.pollId };
  })
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("poll_responses")
      .select("id, completed_at, reward_kes")
      .eq("user_id", context.userId)
      .eq("poll_id", data.pollId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

export const submitPollResponse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: SubmitPollResponseInput) => {
    if (!i?.pollId) throw new Error("pollId required");
    if (!Array.isArray(i.answers)) throw new Error("answers required");
    return i;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: poll, error: pErr } = await supabase
      .from("polls")
      .select("id,status,reward_kes")
      .eq("id", data.pollId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!poll) throw new Error("Poll not found");
    if (poll.status !== "open") throw new Error("This poll is closed.");

    const { data: questions, error: qErr } = await supabase
      .from("poll_questions")
      .select("id,kind,required")
      .eq("poll_id", data.pollId);
    if (qErr) throw new Error(qErr.message);

    const qMap = new Map(
      (questions ?? []).map((q) => [q.id, q as { id: string; kind: string; required: boolean }]),
    );

    // Validate required questions are answered.
    for (const q of questions ?? []) {
      if (!q.required) continue;
      const a = data.answers.find((x) => x.questionId === q.id);
      if (!a) throw new Error("Please answer every required question.");
      if (q.kind === "single" && !a.optionId) throw new Error("Please pick an option for every required question.");
      if (q.kind === "multi" && (!a.optionIds || a.optionIds.length === 0))
        throw new Error("Please pick at least one option.");
      if (q.kind === "scale" && (a.value === null || a.value === undefined))
        throw new Error("Please answer the scale question.");
      if (q.kind === "text" && !a.text?.trim()) throw new Error("Please complete the text response.");
    }

    // Already completed?
    const { data: existing } = await supabase
      .from("poll_responses")
      .select("id")
      .eq("user_id", userId)
      .eq("poll_id", data.pollId)
      .maybeSingle();
    if (existing) throw new Error("You've already completed this poll.");

    const reward = Number(poll.reward_kes ?? 0);
    const { data: response, error: rErr } = await supabase
      .from("poll_responses")
      .insert({ poll_id: data.pollId, user_id: userId, reward_kes: reward })
      .select("id")
      .single();
    if (rErr) throw new Error(rErr.message);

    // Build answer rows
    const rows: {
      response_id: string;
      question_id: string;
      option_id?: string | null;
      value_text?: string | null;
      value_numeric?: number | null;
    }[] = [];
    for (const a of data.answers) {
      const q = qMap.get(a.questionId);
      if (!q) continue;
      if (q.kind === "single" && a.optionId) {
        rows.push({ response_id: response.id, question_id: q.id, option_id: a.optionId });
      } else if (q.kind === "multi" && a.optionIds?.length) {
        for (const oid of a.optionIds) {
          rows.push({ response_id: response.id, question_id: q.id, option_id: oid });
        }
      } else if (q.kind === "scale" && a.value !== null && a.value !== undefined) {
        rows.push({ response_id: response.id, question_id: q.id, value_numeric: a.value });
      } else if (q.kind === "text" && a.text) {
        rows.push({ response_id: response.id, question_id: q.id, value_text: a.text.slice(0, 2000) });
      }
    }
    if (rows.length) {
      const { error: aErr } = await supabase.from("poll_answers").insert(rows);
      if (aErr) throw new Error(aErr.message);
    }

    // Credit wallet (admin client — wallet_transactions is admin-write only).
    if (reward > 0) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("wallet_transactions").insert({
        user_id: userId,
        amount_kes: reward,
        kind: "reward",
        memo: "Poll completed",
      });
    }

    return { responseId: response.id, rewardKes: reward };
  });
