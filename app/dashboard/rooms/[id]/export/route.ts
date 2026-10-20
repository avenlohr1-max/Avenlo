import { z } from "zod";
import { collaborationContext } from "@/lib/collaboration-server";
import { exportDossier, roomIsActive, proofFields, type Room, type Proof, type Entry } from "@/lib/collaboration";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, user } = await collaborationContext(["candidate", "company"]);
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return new Response("Unavailable", { status: 404 });
  const { data: room, error } = await supabase.from("decision_rooms").select("*").eq("id", id).maybeSingle();
  if (error || !room || !roomIsActive(room)) return new Response("Unavailable", { status: 404 });
  // Fail closed rather than silently truncate an exported record.
  const [entries, proofs] = await Promise.all([
    supabase.from("dossier_entries").select("*", { count: "exact" }).eq("room_id", id).order("created_at").limit(1000),
    supabase.from("proof_packages").select(proofFields, { count: "exact" }).eq("room_id", id).eq("shared", true).order("captured_at").limit(1000),
  ]);
  if (entries.error || proofs.error || entries.count === null || proofs.count === null || entries.count !== entries.data?.length || proofs.count !== proofs.data?.length) return new Response("Unable to export the complete record. Contact support.", { status: 503 });
  const { error: auditError } = await supabase.from("dossier_exports").insert({ room_id: id, actor_id: user.id });
  if (auditError) return new Response("Unable to record export authorization. Try again.", { status: 409 });
  // Recheck consent after reading and logging, before releasing the snapshot.
  const current = await supabase.from("decision_rooms").select("active, expires_at").eq("id", id).maybeSingle();
  if (current.error || !current.data || !roomIsActive(current.data)) return new Response("Access ended", { status: 403 });
  return Response.json(exportDossier(room as Room, entries.data as Entry[], proofs.data as Proof[]), { headers: { "Cache-Control": "no-store, private", "Content-Disposition": `attachment; filename="avenlo-dossier-${id}.json"`, "X-Content-Type-Options": "nosniff" } });
}
