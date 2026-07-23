import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export function normalizeKenyanPhone(input: string): string {
  const digits = String(input).replace(/[^\d+]/g, "");
  if (digits.startsWith("+254")) return digits.slice(1);
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;
  return digits.replace(/^\+/, "");
}

function isValidKenyanMsisdn(msisdn: string): boolean {
  return /^254[17]\d{8}$/.test(msisdn);
}

export type VerificationStatus = {
  mpesaPhone: string | null;
  mpesaVerified: boolean;
  emailVerified: boolean;
};

export const getVerificationStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VerificationStatus> => {
    const { data } = await context.supabase
      .from("profiles")
      .select("mpesa_phone,mpesa_phone_verified,email_verified_cached")
      .eq("id", context.userId)
      .maybeSingle();
    return {
      mpesaPhone: (data?.mpesa_phone as string | null) ?? null,
      mpesaVerified: Boolean(data?.mpesa_phone_verified),
      emailVerified: Boolean(data?.email_verified_cached),
    };
  });

/**
 * Called by the client AFTER supabase.auth.verifyOtp succeeds for the phone.
 * Marks profiles.mpesa_phone as verified.
 */
export const confirmMpesaVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { phone: string }) => {
    const msisdn = normalizeKenyanPhone(input?.phone ?? "");
    if (!isValidKenyanMsisdn(msisdn)) {
      throw new Error("Enter a valid Kenyan phone (07XXXXXXXX or 2547XXXXXXXX).");
    }
    return { phone: msisdn };
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Confirm the caller's auth.users.phone actually matches — proves they held the OTP.
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const authPhone = authUser?.user?.phone ?? "";
    if (authPhone !== data.phone) {
      throw new Error("Phone verification did not complete. Please try again.");
    }

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        mpesa_phone: data.phone,
        mpesa_phone_verified: true,
        mpesa_verified_at: new Date().toISOString(),
      })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);

    return { ok: true, phone: data.phone };
  });
