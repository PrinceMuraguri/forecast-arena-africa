import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export type FeatureFlag = {
  key: string;
  enabled: boolean;
  description: string | null;
};

export const listFeatureFlags = createServerFn({ method: "GET" }).handler(
  async (): Promise<FeatureFlag[]> => {
    const sb = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data, error } = await sb
      .from("feature_flags")
      .select("key, enabled, description");
    if (error) throw new Error(error.message);
    return (data ?? []) as FeatureFlag[];
  },
);
