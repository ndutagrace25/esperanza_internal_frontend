"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function ProductsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Products</h1>
          <p className="text-muted-foreground">
            Manage your products and inventory.
          </p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <p className="text-muted-foreground">Product management coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

