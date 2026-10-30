import { expect, test } from "vitest";
import { checkoutDocuments, checkoutOffer, checkoutPoliciesApproved, checkoutPolicyVersion, checkoutRequest, invoiceIssuer } from "./checkout";

const request = { market: "india", plan: "intelligence", accepted: true, policyVersion: checkoutPolicyVersion,
  billing: { name: "Synthetic Candidate", address: "Synthetic 123 Test Road", city: "Hyderabad", state: "Telangana", postalCode: "500008", country: "India" } };
test("checkout approval requires every exact published policy version", () => {
  expect(checkoutPoliciesApproved({})).toBe(false);
  const env = Object.fromEntries(checkoutDocuments.map(document => [document.key, checkoutPolicyVersion]));
  expect(checkoutPoliciesApproved(env)).toBe(true);
  env.AVENLO_REFUND_POLICY_VERSION = "old";
  expect(checkoutPoliciesApproved(env)).toBe(false);
});
test("checkout requires affirmative consent, current terms and full billing data", () => {
  expect(checkoutRequest(request).success).toBe(true);
  expect(checkoutRequest({ ...request, accepted: false }).success).toBe(false);
  expect(checkoutRequest({ ...request, policyVersion: "old" }).success).toBe(false);
  expect(checkoutRequest({ ...request, billing: { ...request.billing, name: "", address: "" } }).success).toBe(false);
});
test("unspecified Premium scope cannot be sold and the invoice does not claim GST registration", () => {
  expect(checkoutOffer("international", "premium")).toBeNull();
  expect(checkoutOffer("india", "intelligence")?.items.length).toBe(4);
  expect(invoiceIssuer.gstRegistered).toBe(false);
});
