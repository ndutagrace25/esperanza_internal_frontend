"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ExpensesTable } from "@/components/expenses/ExpensesTable";
import { CreateExpenseDialog } from "@/components/expenses/CreateExpenseDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactSelectBase from "react-select";

interface SelectOption {
  value: string;
  label: string;
}
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchExpenses, clearExpenseError } from "@/lib/slices/expenseSlice";
import { Plus, Search, Loader2, Filter, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useExpenseCategories } from "@/lib/hooks/useExpenseCategories";
import { useEmployees } from "@/lib/hooks/useEmployees";
import type { ExpenseStatus } from "@/lib/types";
import ReactSelect from "react-select";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ExpensesPage() {
  const dispatch = useAppDispatch();
  const { expenses, pagination, isLoading, error } = useAppSelector(
    (state) => state.expense
  );
  const { categories } = useExpenseCategories();
  const { employees } = useEmployees();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ExpenseStatus | "ALL">(
    "ALL"
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [submittedByFilter, setSubmittedByFilter] = useState<string>("ALL");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch expenses with all filters applied via API
  const fetchWithFilters = useCallback(() => {
    const options: {
      page: number;
      limit: number;
      status?: ExpenseStatus;
      categoryId?: string;
      submittedById?: string;
      search?: string;
    } = {
      page: currentPage,
      limit: 10,
    };

    if (statusFilter !== "ALL") {
      options.status = statusFilter;
    }
    if (categoryFilter !== "ALL") {
      options.categoryId = categoryFilter;
    }
    if (submittedByFilter !== "ALL") {
      options.submittedById = submittedByFilter;
    }
    if (debouncedSearchTerm.trim()) {
      options.search = debouncedSearchTerm.trim();
    }

    dispatch(fetchExpenses(options));
  }, [
    dispatch,
    currentPage,
    statusFilter,
    categoryFilter,
    submittedByFilter,
    debouncedSearchTerm,
  ]);

  useEffect(() => {
    fetchWithFilters();
  }, [fetchWithFilters]);

  useEffect(() => {
    return () => {
      dispatch(clearExpenseError());
    };
  }, [dispatch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const clearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value as ExpenseStatus | "ALL");
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  const handleSubmittedByChange = (value: string) => {
    setSubmittedByFilter(value);
    setCurrentPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
              Expenses
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track and manage business expenses.
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full sm:w-auto"
            size="default"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Expense
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="font-medium text-red-500">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="space-y-3">
          {/* Search Bar - Full Width */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search expenses..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-2 flex-1 sm:flex-initial sm:w-[180px]">
              <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
              <ReactSelectBase<SelectOption>
                instanceId="expenses-status-filter"
                options={[
                  { value: "ALL", label: "All Statuses" },
                  { value: "DRAFT", label: "Draft" },
                  { value: "PENDING", label: "Pending" },
                  { value: "APPROVED", label: "Approved" },
                  { value: "PAID", label: "Paid" },
                  { value: "REJECTED", label: "Rejected" },
                  { value: "CANCELLED", label: "Cancelled" },
                ] as SelectOption[]}
                value={[
                  { value: "ALL", label: "All Statuses" },
                  { value: "DRAFT", label: "Draft" },
                  { value: "PENDING", label: "Pending" },
                  { value: "APPROVED", label: "Approved" },
                  { value: "PAID", label: "Paid" },
                  { value: "REJECTED", label: "Rejected" },
                  { value: "CANCELLED", label: "Cancelled" },
                ].find((opt) => opt.value === statusFilter) || null}
                onChange={(option) => handleStatusChange(option?.value || "ALL")}
                placeholder="Status"
                isClearable={false}
                isSearchable
                styles={{
                  control: (base) => ({ ...base, minHeight: "40px" }),
                  menu: (base) => ({ ...base, zIndex: 9999 }),
                }}
              />
            </div>

            {/* Category Filter */}
            <div className="flex-1 sm:flex-initial sm:w-[200px]">
              <ReactSelect
                instanceId="category-filter"
                options={[
                  { value: "ALL", label: "All Categories" },
                  ...categories.map((category) => ({
                    value: category.id,
                    label: category.name,
                  })),
                ]}
                value={
                  categoryFilter === "ALL"
                    ? { value: "ALL", label: "All Categories" }
                    : {
                      value: categoryFilter,
                      label:
                        categories.find((c) => c.id === categoryFilter)
                          ?.name || "",
                    }
                }
                onChange={(option) =>
                  handleCategoryChange(option?.value || "ALL")
                }
                isSearchable
                placeholder="Category..."
                classNames={{
                  control: (state) =>
                    `!min-h-[40px] !border-input !bg-background !shadow-sm ${state.isFocused ? "!border-ring !ring-1 !ring-ring" : ""
                    }`,
                  menu: () => "!bg-white !border !shadow-md !z-50",
                  option: (state) =>
                    `!cursor-pointer ${state.isSelected
                      ? "!bg-primary !text-primary-foreground"
                      : state.isFocused
                        ? "!bg-accent"
                        : ""
                    }`,
                  placeholder: () => "!text-muted-foreground",
                  singleValue: () => "!text-foreground",
                  input: () => "!text-foreground",
                }}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "0.375rem",
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: "0.375rem",
                  }),
                }}
              />
            </div>

            {/* Submitted By Filter */}
            <div className="flex-1 sm:flex-initial sm:w-[200px]">
              <ReactSelect
                instanceId="submitted-by-filter"
                options={[
                  { value: "ALL", label: "All Employees" },
                  ...employees.map((employee) => ({
                    value: employee.id,
                    label: `${employee.firstName} ${employee.lastName}`,
                  })),
                ]}
                value={
                  submittedByFilter === "ALL"
                    ? { value: "ALL", label: "All Employees" }
                    : {
                      value: submittedByFilter,
                      label: (() => {
                        const emp = employees.find(
                          (e) => e.id === submittedByFilter
                        );
                        return emp
                          ? `${emp.firstName} ${emp.lastName}`
                          : "";
                      })(),
                    }
                }
                onChange={(option) =>
                  handleSubmittedByChange(option?.value || "ALL")
                }
                isSearchable
                placeholder="Submitted by..."
                classNames={{
                  control: (state) =>
                    `!min-h-[40px] !border-input !bg-background !shadow-sm ${state.isFocused ? "!border-ring !ring-1 !ring-ring" : ""
                    }`,
                  menu: () => "!bg-white !border !shadow-md !z-50",
                  option: (state) =>
                    `!cursor-pointer ${state.isSelected
                      ? "!bg-primary !text-primary-foreground"
                      : state.isFocused
                        ? "!bg-accent"
                        : ""
                    }`,
                  placeholder: () => "!text-muted-foreground",
                  singleValue: () => "!text-foreground",
                  input: () => "!text-foreground",
                }}
                styles={{
                  control: (base) => ({
                    ...base,
                    borderRadius: "0.375rem",
                  }),
                  menu: (base) => ({
                    ...base,
                    borderRadius: "0.375rem",
                  }),
                }}
              />
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        {isLoading && expenses.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center border rounded-lg bg-card">
            <p className="text-muted-foreground">
              {searchTerm ||
                statusFilter !== "ALL" ||
                categoryFilter !== "ALL" ||
                submittedByFilter !== "ALL"
                ? "No expenses found matching your filters."
                : "No expenses found. Create your first expense to get started."}
            </p>
          </div>
        ) : (
          <ExpensesTable
            expenses={expenses}
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        )}

        {/* Create Expense Dialog */}
        <CreateExpenseDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={() => {
            setIsCreateDialogOpen(false);
            dispatch(fetchExpenses({ page: currentPage, limit: 10 }));
          }}
        />
      </div>
    </DashboardLayout>
  );
}
