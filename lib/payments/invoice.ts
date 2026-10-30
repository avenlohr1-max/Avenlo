import { z } from "zod";
import { billingSchema } from "./checkout";

export const invoiceSnapshotSchema = z.object({
  issuer: z.object({ name: z.string(), address: z.string(), email: z.string(), gstRegistered: z.literal(false) }),
  billing: billingSchema.extend({ email: z.string().email() }),
  plan: z.string(), items: z.array(z.string()), termMonths: z.number(),
  amountPaise: z.number().int().positive(), currency: z.enum(["INR", "USD"]),
  accepted: z.literal(true), policyVersion: z.string(), acceptedAt: z.string(),
});
export type InvoiceSnapshot = z.infer<typeof invoiceSnapshotSchema>;

export function invoiceMoney(amountPaise: number, currency: string) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: 2 }).format(amountPaise / 100);
}

function words(n: number): string {
  const ones = ["Zero","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  if (n < 20) return ones[n];
  if (n < 100) return ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"][Math.floor(n/10)] + (n%10 ? " " + words(n%10) : "");
  if (n < 1000) return words(Math.floor(n/100)) + " Hundred" + (n%100 ? " " + words(n%100) : "");
  if (n < 100000) return words(Math.floor(n/1000)) + " Thousand" + (n%1000 ? " " + words(n%1000) : "");
  if (n < 10000000) return words(Math.floor(n/100000)) + " Lakh" + (n%100000 ? " " + words(n%100000) : "");
  return words(Math.floor(n/10000000)) + " Crore" + (n%10000000 ? " " + words(n%10000000) : "");
}

export function invoiceAmountWords(amountPaise: number, currency: string) {
  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) throw new Error("Invalid invoice amount");
  const whole = Math.floor(amountPaise/100), fraction = amountPaise%100;
  return (currency === "INR" ? "Indian Rupees " : "US Dollars ") + words(whole) +
    (fraction ? " and " + words(fraction) + (currency === "INR" ? " Paise" : " Cents") : "") + " Only";
}
