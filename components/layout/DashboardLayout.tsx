"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { logout } from "@/lib/slices/authSlice";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Briefcase,
  DollarSign,
  FileText,
  LogOut,
  Menu,
  Package,
  Plug,
  ShoppingCart,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const allMenuItems = [
  { name: "Employees", icon: Users, href: "/employees" },
  { name: "Clients", icon: Briefcase, href: "/clients" },
  { name: "Client Integrations", icon: Plug, href: "/client-integrations" },
  { name: "Products", icon: Package, href: "/products" },
  { name: "Job Cards", icon: FileText, href: "/job-cards" },
  { name: "Sales", icon: ShoppingCart, href: "/sales" },
  { name: "Expenses", icon: DollarSign, href: "/expenses" },
  { name: "Business Analytics", icon: BarChart3, href: "/analytics" },
];

// Menu items visible to STAFF role
const staffMenuItems = [
  { name: "Employees", icon: Users, href: "/employees" },
  { name: "Clients", icon: Briefcase, href: "/clients" },
  { name: "Products", icon: Package, href: "/products" },
  { name: "Job Cards", icon: FileText, href: "/job-cards" },
];

interface SidebarContentProps {
  pathname: string;
  employee: {
    firstName: string;
    lastName: string;
    email: string;
    role: {
      name: string;
    } | null;
  } | null;
  onLogout: () => void;
  onItemClick?: () => void;
  menuItems: typeof allMenuItems;
}

const SidebarContent = ({
  pathname,
  employee,
  onLogout,
  onItemClick,
  menuItems,
}: SidebarContentProps) => (
  <div
    className="flex flex-col h-full bg-card"
    style={{ backgroundColor: "hsl(var(--card))" }}
  >
    {/* Logo */}
    <div
      className="flex items-center gap-3 p-6 border-b bg-card"
      style={{ backgroundColor: "hsl(var(--card))" }}
    >
      <div className="relative w-10 h-10">
        <Image
          src="/logo.jpeg"
          alt="Esperanza Logo"
          fill
          className="object-contain rounded"
        />
      </div>
      <div>
        <h1 className="font-bold text-lg text-foreground">Esperanza</h1>
        <p className="text-xs text-muted-foreground">Digital Solutions</p>
      </div>
    </div>

    {/* User Info */}
    {employee && (
      <div
        className="p-4 border-b bg-card"
        style={{ backgroundColor: "hsl(var(--card))" }}
      >
        <p className="text-sm font-medium text-foreground">
          {employee.firstName} {employee.lastName}
        </p>
        <p className="text-xs text-muted-foreground">{employee.email}</p>
      </div>
    )}

    {/* Menu Items */}
    <nav
      className="flex-1 p-4 space-y-1 overflow-y-auto bg-card"
      style={{ backgroundColor: "hsl(var(--card))" }}
    >
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors bg-card",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>

    {/* Logout Button */}
    <div
      className="p-4 border-t bg-card"
      style={{ backgroundColor: "hsl(var(--card))" }}
    >
      <Button
        variant="ghost"
        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
        onClick={onLogout}
      >
        <LogOut className="h-5 w-5 mr-3" />
        Logout
      </Button>
    </div>
  </div>
);

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { employee } = useAppSelector((state) => state.auth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter menu items based on user role
  const menuItems =
    employee?.role?.name === "DIRECTOR" ? allMenuItems : staffMenuItems;

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:border-r bg-card">
        <SidebarContent
          pathname={pathname}
          employee={employee}
          onLogout={handleLogout}
          menuItems={menuItems}
        />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image
                src="/logo.jpeg"
                alt="Esperanza Logo"
                fill
                className="object-contain rounded"
              />
            </div>
            <div>
              <h1 className="font-bold text-sm">Esperanza</h1>
            </div>
          </div>
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-card border-0">
              <SidebarContent
                pathname={pathname}
                employee={employee}
                onLogout={handleLogout}
                onItemClick={() => setMobileMenuOpen(false)}
                menuItems={menuItems}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
