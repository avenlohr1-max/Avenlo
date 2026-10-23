import { canUseContentStudio } from "@/lib/studio-access";
import { studioContent } from "@/lib/studio-content";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!await canUseContentStudio()) return new Response("Internal access required.", { status: 403, headers: { "Cache-Control": "private, no-store" } });
  return new Response(studioContent["index.html"], { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY", "X-Robots-Tag": "noindex, nofollow" } });
}
