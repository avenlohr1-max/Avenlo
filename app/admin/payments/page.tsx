import { PaymentWorkspace } from "@/app/components/payment-workspace";
import { paymentWorkspace } from "@/lib/payments/workspace";
export const dynamic = "force-dynamic";
export const metadata = { title: "Payment test and reconciliation — Avenlo", robots: { index: false, follow: false } };
export default async function Payments({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  return <PaymentWorkspace {...await paymentWorkspace(true)} result={(await searchParams).result} />;
}
