"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function ExpensesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Expenses</h1>
          <p className="text-muted-foreground">
            Track and manage business expenses.
          </p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <p className="text-muted-foreground">Expense management coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

