import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

function safeRedirectPath(value: string | null) {
  const path = value || "/dashboard";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const redirectPath = safeRedirectPath(requestUrl.searchParams.get("redirect") || requestUrl.searchParams.get("next"));

  const supabase = await createClient();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("verification_failed")}`, requestUrl.origin));
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(redirectPath, requestUrl.origin));
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent("verification_failed")}`, requestUrl.origin));
  }

  return NextResponse.redirect(new URL("/login?error=missing_code", requestUrl.origin));
}
