"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { collaborationContext } from "@/lib/collaboration-server";
import { proofSchema } from "@/lib/collaboration";

export async function prepareProof(form: FormData) {
  const { supabase, user } = await collaborationContext(["candidate"]);
  const parsed = proofSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/dashboard/proofs?result=invalid");
  const { signalId, roomId, ...snapshot } = parsed.data;
  const { data: signal, error: sourceError } = await supabase.from("candidate_signals").select("id").eq("id", signalId).eq("candidate_id", user.id).eq("verification_status", "candidate_confirmed").maybeSingle();
  if (sourceError || !signal) redirect("/dashboard/proofs?result=unavailable");
  const { data, error } = await supabase.from("proof_packages").insert({ ...snapshot, source_date: snapshot.source_date || null, candidate_id: user.id, signal_id: signalId, room_id: roomId || null, shared: false }).select("id").single();
  if (error || !data) redirect("/dashboard/proofs?result=error");
  revalidatePath("/dashboard/proofs"); redirect(`/dashboard/proofs?preview=${data.id}`);
}
export async function changeProofSharing(form: FormData) {
  const { supabase, user } = await collaborationContext(["candidate"]);
  const parsed = z.object({ id: z.string().uuid(), operation: z.enum(["share", "withdraw", "delete"]) }).safeParse(Object.fromEntries(form));
  if (!parsed.success) redirect("/dashboard/proofs?result=invalid");
  const { id, operation } = parsed.data;
  const query = operation === "delete" ? supabase.from("proof_packages").delete() : supabase.from("proof_packages").update({ shared: operation === "share" });
  const { data, error } = await query.eq("id", id).eq("candidate_id", user.id).select("id").maybeSingle();
  if (error || !data) redirect("/dashboard/proofs?result=error");
  revalidatePath("/dashboard/proofs"); revalidatePath("/dashboard/rooms", "layout"); redirect("/dashboard/proofs?result=saved");
}
