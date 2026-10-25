import { createClient as createAuthClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

function failure(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  if (process.env.ENABLE_CANDIDATE_ACCOUNT_ERASURE !== "true") {
    return failure("Account deletion is not available yet. Contact candidates@avenlo.in for help.", 503);
  }
  // Next's server URL can use its internal hostname behind a proxy. The
  // configured public site is authoritative; do not trust forwarded headers.
  let expectedOrigin: string;
  try { expectedOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL || request.url).origin; }
  catch { return failure("Account deletion is unavailable until site configuration is corrected.", 503); }
  if (request.headers.get("origin") !== expectedOrigin) {
    return failure("Open account settings on Avenlo to delete your account.", 403);
  }
  if (!request.headers.get("content-type")?.startsWith("application/json")) {
    return failure("Send the account confirmation as JSON.", 415);
  }
  let body: { confirmation?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return failure("Check your deletion confirmation.", 400); }
  if (!body || body.confirmation !== "DELETE" || typeof body.password !== "string" || !body.password || body.password.length > 512) {
    return failure("Enter your current password and type DELETE to confirm.", 400);
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.email) return failure("Sign in again before deleting your account.", 401);
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profileError) return failure("Unable to check your account. Please try again.", 503);
    if (profile?.role !== "candidate") return failure("This deletion flow is available to candidate accounts only.", 403);

    const admin = createAdminClient();
    // Service orders may have payment, refund, dispute or retention obligations.
    // Never cascade them away through this self-service flow.
    const { count, error: orderError } = await admin.from("candidate_service_orders").select("id", { count: "exact", head: true }).eq("candidate_id", user.id);
    if (orderError || count === null) return failure("Unable to check service records. Please try again.", 503);
    if (count > 0) return failure("Your account has service records. Contact candidates@avenlo.in so we can review payments, refunds and deletion with you.", 409);

    // Use an isolated public client: reauthentication must not replace the
    // caller's cookies or put a user's session on the privileged admin client.
    const verifier = createAuthClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data: verified, error: passwordError } = await verifier.auth.signInWithPassword({ email: user.email, password: body.password });
    if (passwordError || !verified.session || verified.user?.id !== user.id) {
      // A successful verification for any unexpected identity must not leave a session behind.
      if (verified.session) await admin.auth.admin.signOut(verified.session.access_token, "local");
      return failure("Your password could not be confirmed. Check it and try again.", 403);
    }
    const { error: signOutError } = await admin.auth.admin.signOut(verified.session.access_token, "global");
    if (signOutError) return failure("Unable to revoke account sessions. No account deletion was completed; please try again.", 503);

    const bucket = admin.storage.from("candidate-documents");
    // Never trust resume_path or a request-supplied ID. Discover only objects
    // inside the authenticated candidate's UUID folder, including old versions.
    const paths: string[] = [];
    const folders = [user.id];
    for (let index = 0; index < folders.length; index++) {
      if (folders.length > 100) throw new Error("storage-limit");
      for (let offset = 0; ; offset += 100) {
        const { data: objects, error: listError } = await bucket.list(folders[index], { limit: 100, offset, sortBy: { column: "name", order: "asc" } });
        if (listError || !objects) throw new Error("storage-list");
        for (const object of objects) {
          if (!object.name || object.name === "." || object.name === ".." || object.name.includes("/")) throw new Error("storage-path");
          const path = `${folders[index]}/${object.name}`;
          if (object.id) paths.push(path); else folders.push(path);
        }
        if (paths.length > 2000 || folders.length > 100) throw new Error("storage-limit");
        if (objects.length < 100) break;
      }
    }
    for (let index = 0; index < paths.length; index += 100) {
      const { error: removeError } = await bucket.remove(paths.slice(index, index + 100));
      if (removeError) throw new Error("storage-remove");
    }
    // Hard deletion cascades through profiles and their candidate-owned records.
    // Auth deletion must never run if document discovery/removal failed.
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id, false);
    if (deleteError) throw new Error("auth-delete");
    await supabase.auth.signOut({ scope: "local" });
    return NextResponse.json({ deleted: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return failure("Deletion could not be completed. Your sessions may have ended and some resume files may have been removed. Sign in again to retry, or contact candidates@avenlo.in.", 503);
  }
}
