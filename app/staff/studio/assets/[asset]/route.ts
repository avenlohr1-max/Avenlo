import { canUseContentStudio } from "@/lib/studio-access";
import { studioContent } from "@/lib/studio-content";

export const dynamic = "force-dynamic";
const types: Record<string, string> = { "styles.css": "text/css; charset=utf-8", "app.js": "text/javascript; charset=utf-8" };

export async function GET(_request: Request, { params }: { params: Promise<{ asset: string }> }) {
  if (!await canUseContentStudio()) return new Response("Internal access required.", { status: 403, headers: { "Cache-Control": "private, no-store" } });
  const { asset } = await params;
  if (!Object.hasOwn(types, asset)) return new Response("Not found.", { status: 404 });
  return new Response(studioContent[asset], { headers: { "Content-Type": types[asset], "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "DENY" } });
}
