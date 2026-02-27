import { TransactionTable } from "@/components/transactions/TransactionTable";

export default function TransactionsPage() {
  return (
    <main className="animate-fade-in-up mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <p className="text-[var(--muted-foreground)]">
          View, search, and manage your transactions
        </p>
      </div>
      <TransactionTable />
    </main>
  );
}
