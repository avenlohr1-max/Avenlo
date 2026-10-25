import { collaborationContext } from "@/lib/collaboration-server";
import { type PaymentRequest } from "./upi";
import { resolvePaymentSettings } from "./settings";

export async function paymentWorkspace(founder: boolean) {
  const { supabase, user } = await collaborationContext(founder ? ["founder"] : ["candidate"]);
  const settingsPromise = resolvePaymentSettings(founder);
  let query = supabase.from("avenlo_upi_requests").select("*").order("created_at", { ascending: false }).limit(founder ? 100 : 30);
  if (!founder) query = query.eq("owner_id", user.id);
  const requests = await query;
  const rows = (requests.data ?? []) as PaymentRequest[];
  const events = rows.length ? await supabase.from("avenlo_upi_events").select("id,request_id,kind,created_at").in("request_id", rows.map(row => row.id)).order("created_at").limit(1000) : { data: [], error: null };
  const settings = await settingsPromise;
  return { requests: rows, events: events.data ?? [], ownerId: user.id, founder, enabled: settings.enabled, mode: settings.mode, unavailable: Boolean(requests.error || events.error) };
}
