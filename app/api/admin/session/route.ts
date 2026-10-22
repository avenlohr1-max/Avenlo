import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ADMIN_ACCESS_COOKIE = "avenlo_admin_access";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  if (!profile || profile.status === "suspended" || !["staff", "founder"].includes(profile.role)) {
    return NextResponse.json({ error: "Internal access required." }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_ACCESS_COOKIE,
    value: "1",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: ADMIN_ACCESS_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
