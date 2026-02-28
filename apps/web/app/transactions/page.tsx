import { TransactionTable } from "@/components/transactions/TransactionTable";
import { PageWrapper, PageHeader } from "@/components/ui";

export default function TransactionsPage() {
  return (
    <PageWrapper maxWidth="7xl" className="animate-fade-in-up">
      <PageHeader
        title="Transactions"
        subtitle="View, search, and manage your transactions"
      />
      <TransactionTable />
    </PageWrapper>
  );
}
