import { expect, test } from "vitest";
import { trialRequestPolicy, trialUserAllowed } from "./hosted-trial";

test("trial denies signup and email callbacks and requires a demo session for APIs and actions", () => {
  expect(trialRequestPolicy("/join", "GET")).toBe("blocked");
  expect(trialRequestPolicy("/auth/callback", "GET")).toBe("blocked");
  expect(trialRequestPolicy("/forgot-password", "POST")).toBe("blocked");
  expect(trialRequestPolicy("/api/payments/razorpay/create-order", "POST")).toBe("authenticated");
  expect(trialRequestPolicy("/dashboard/profile", "POST")).toBe("authenticated");
  expect(trialRequestPolicy("/login", "GET")).toBe("public");
});

test("trial account allowlist fails closed and requires the exact verified ID", () => {
  const id = "11111111-1111-4111-8111-111111111111";
  expect(trialUserAllowed(id, undefined)).toBe(false);
  expect(trialUserAllowed(id, "*")).toBe(false);
  expect(trialUserAllowed(id, id + "2")).toBe(false);
  expect(trialUserAllowed(id, id)).toBe(true);
});
