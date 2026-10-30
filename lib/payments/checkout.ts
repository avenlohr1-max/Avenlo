import { z } from "zod";

export const checkoutPolicyVersion = "2026-10-29";
export const checkoutDocuments = [
  { type: "candidate_terms", key: "AVENLO_CANDIDATE_TERMS_VERSION", path: "/terms", title: "Candidate Terms" },
  { type: "privacy_notice", key: "AVENLO_PRIVACY_VERSION", path: "/privacy", title: "Privacy Notice" },
  { type: "paid_service_terms", key: "AVENLO_PAID_SERVICE_TERMS_VERSION", path: "/paid-service-terms", title: "Paid Service Terms" },
  { type: "refund_policy", key: "AVENLO_REFUND_POLICY_VERSION", path: "/refunds", title: "Refund and Cancellation Policy" },
] as const;

export const invoiceIssuer = {
  name: "Avenlo",
  address: "9-4-136/d/3 Anurag Colony, Tolichowki, Hyderabad 500008",
  state: "Telangana", country: "India", email: "support@avenlo.in",
  gstRegistered: false,
};

export const billingSchema = z.object({
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(8).max(500),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().min(3).max(20),
  country: z.string().trim().min(2).max(100),
});

export function checkoutPoliciesApproved(env: Record<string, string | undefined> = process.env) {
  return checkoutDocuments.every(document => env[document.key] === checkoutPolicyVersion);
}

export function checkoutOffer(market: string, code: string) {
  if (!["india", "international"].includes(market) || !["intelligence", "executive"].includes(code)) return null;
  return code === "intelligence" ? {
    title: "Avenlo Intelligence", termMonths: 6,
    items: ["Professional profile review", "Skills and experience analysis", "Strengths, gaps and career positioning", "Human review and intelligence reporting"],
  } : {
    title: "Executive", termMonths: 6,
    items: ["Intelligence services", "Dedicated human review and advisor support", "Priority matching consideration", "Interview preparation and feedback", "Company representation and post-interview support"],
  };
}

export function checkoutRequest(value: unknown) {
  return z.object({
    market: z.enum(["india", "international"]), plan: z.string().max(40), accepted: z.literal(true),
    policyVersion: z.literal(checkoutPolicyVersion), billing: billingSchema,
  }).safeParse(value);
}
