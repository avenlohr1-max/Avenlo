"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { collaborationContext } from "@/lib/collaboration-server";
import { roomSchema, messageSchema, dossierSchema, roomIsActive } from "@/lib/collaboration";

export async function createRoom(form: FormData) {
  const { supabase, user } = await collaborationContext(["candidate"]);
  const parsed = roomSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/dashboard/rooms?result=invalid");
  const { data: job, error: lookupError } = await supabase.from("jobs").select("company_id, status, expires_at").eq("id", parsed.data.jobId).eq("status", "open").maybeSingle();
  if (lookupError || !job || (job.expires_at && new Date(job.expires_at).getTime() <= Date.now())) redirect("/dashboard/rooms?result=unavailable");
  const { data, error } = await supabase.from("decision_rooms").insert({ candidate_id: user.id, company_id: job.company_id, title: parsed.data.title, purpose: parsed.data.purpose }).select("id").single();
  if (error || !data) redirect("/dashboard/rooms?result=error");
  revalidatePath("/dashboard/rooms"); redirect(`/dashboard/rooms/${data.id}`);
}
export async function changeRoomAccess(form: FormData) {
  const { supabase, user } = await collaborationContext(["candidate"]);
  const parsed = z.object({ id: z.string().uuid(), operation: z.enum(["withdraw", "delete"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/dashboard/rooms?result=invalid");
  const query = parsed.data.operation === "delete" ? supabase.from("decision_rooms").delete() : supabase.from("decision_rooms").update({ active: false });
  const { data, error } = await query.eq("id", parsed.data.id).eq("candidate_id", user.id).select("id").maybeSingle();
  if (error || !data) redirect("/dashboard/rooms?result=error");
  revalidatePath("/dashboard/rooms"); revalidatePath("/dashboard/proofs"); redirect("/dashboard/rooms?result=saved");
}
export async function appendRoomMessage(form: FormData) {
  const { supabase, user } = await collaborationContext(["candidate", "company"]);
  const parsed = messageSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/dashboard/rooms?result=invalid");
  const { roomId, kind, body } = parsed.data;
  const { error } = await supabase.from("room_messages").insert({ room_id: roomId, author_id: user.id, kind, body });
  revalidatePath(`/dashboard/rooms/${roomId}`); redirect(`/dashboard/rooms/${roomId}?result=${error ? "error" : "saved"}`);
}
export async function appendDossierEntry(form: FormData) {
  const { supabase, user } = await collaborationContext(["candidate", "company"]);
  const parsed = dossierSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/dashboard/rooms?result=invalid");
  const { roomId, kind, body, proofId } = parsed.data;
  const { data: room } = await supabase.from("decision_rooms").select("active, expires_at").eq("id", roomId).maybeSingle();
  if (!room || !roomIsActive(room)) redirect("/dashboard/rooms?result=unavailable");
  const { error } = await supabase.from("dossier_entries").insert({ room_id: roomId, author_id: user.id, kind, body, proof_id: proofId || null });
  revalidatePath(`/dashboard/rooms/${roomId}`); redirect(`/dashboard/rooms/${roomId}?result=${error ? "error" : "saved"}#dossier`);
}
