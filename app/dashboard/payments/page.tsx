import { PaymentWorkspace } from "@/app/components/payment-workspace";
import { paymentWorkspace } from "@/lib/payments/workspace";
export const dynamic = "force-dynamic";
export const metadata = { title: "Payment history — Avenlo", robots: { index: false, follow: false } };
export default async function Payments({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  return <PaymentWorkspace {...await paymentWorkspace(false)} result={(await searchParams).result} />;
}
