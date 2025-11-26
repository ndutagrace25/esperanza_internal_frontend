"use client";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAppSelector } from "@/lib/hooks";

export default function Home() {
  const { employee } = useAppSelector((state) => state.auth);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
          <p className="text-muted-foreground">
            {employee
              ? `Hello, ${employee.firstName} ${employee.lastName}`
              : "Welcome to Esperanza Digital Solutions"}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2">Quick Actions</h3>
            <p className="text-sm text-muted-foreground">
              Access your most used features from the sidebar menu.
            </p>
          </div>
          <div className="p-6 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2">Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Manage employees, clients, products, and more.
            </p>
          </div>
          <div className="p-6 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2">Analytics</h3>
            <p className="text-sm text-muted-foreground">
              View business insights and reports.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
