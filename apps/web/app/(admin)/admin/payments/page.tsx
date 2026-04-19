import { CreditCard } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { EmptyState } from '@/components/admin/empty-state';

export default function PaymentsPage() {
  return (
    <>
      <PageHeader
        title="Payments"
        subtitle="Fees, Stripe activity, and per-payer visibility."
      />
      <EmptyState
        icon={CreditCard}
        title="Finance feed coming after Stripe wiring"
        description="Once Stripe Connect is in, this will show Payment rows scoped by payerId — the exact reason a non-paying parent sees zero rows."
      />
    </>
  );
}
