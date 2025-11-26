"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Business Analytics</h1>
          <p className="text-muted-foreground">
            View business insights and analytics.
          </p>
        </div>
        <div className="p-6 border rounded-lg bg-card">
          <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

