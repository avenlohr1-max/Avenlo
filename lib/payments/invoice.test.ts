import { expect, test } from "vitest";
import { invoiceAmountWords, invoiceMoney, invoiceSnapshotSchema } from "./invoice";
test("invoice totals format the exact integer paise", () => {
  expect(invoiceMoney(199900,"INR")).toContain("1,999.00");
  expect(invoiceAmountWords(199900,"INR")).toBe("Indian Rupees One Thousand Nine Hundred Ninety Nine Only");
  expect(invoiceAmountWords(10001,"INR")).toBe("Indian Rupees One Hundred and One Paise Only");
  expect(() => invoiceAmountWords(100.5,"INR")).toThrow();
});
test("malformed invoice snapshots cannot silently render as issued invoices", () => {
  expect(invoiceSnapshotSchema.safeParse({ issuer: {}, billing: {}, amountPaise: 0 }).success).toBe(false);
});
