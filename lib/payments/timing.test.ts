import { expect, test } from "vitest";
import { bankCreditTimeUtc, checkoutSecondsRemaining } from "./timing";

test("checkout expires at the boundary and fails closed for invalid dates", () => {
  const expiry = "2026-10-26T17:25:00Z";
  expect(checkoutSecondsRemaining(expiry, Date.parse(expiry) - 1001)).toBe(2);
  expect(checkoutSecondsRemaining(expiry, Date.parse(expiry))).toBe(0);
  expect(checkoutSecondsRemaining(expiry, Date.parse(expiry) + 1000)).toBe(0);
  expect(checkoutSecondsRemaining("bad date", 0)).toBe(0);
});

test("bank credits use IST including conversion across midnight", () => {
  expect(bankCreditTimeUtc("2026-10-26T22:35")).toBe("2026-10-26T17:05:00.000Z");
  expect(bankCreditTimeUtc("2026-10-26T00:05")).toBe("2026-10-25T18:35:00.000Z");
  expect(bankCreditTimeUtc("2028-02-29T12:00")).toBe("2028-02-29T06:30:00.000Z");
});

test.each([null, "", "2026-02-29T12:00", "2026-04-31T12:00", "2026-10-26T24:00", "2026-10-26T12:60", "2026-10-26T12:00Z"])("reject invalid or ambiguous bank-credit time %s", value => {
  expect(bankCreditTimeUtc(value)).toBeNull();
});
