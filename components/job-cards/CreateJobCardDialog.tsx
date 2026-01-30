"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/lib/hooks";
import { createJobCard } from "@/lib/slices/jobCardSlice";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Select from "react-select";

interface SelectOption {
  value: string;
  label: string;
}
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useClients } from "@/lib/hooks/useClients";
import { useEmployees } from "@/lib/hooks/useEmployees";
import { useExpenseCategories } from "@/lib/hooks/useExpenseCategories";
import type {
  CreateJobCardData,
  CreateJobTaskData,
  CreateJobExpenseData,
} from "@/lib/services/jobCardService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateJobCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateJobCardDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateJobCardDialogProps) {
  const dispatch = useAppDispatch();
  const {
    clients,
    isLoading: clientsLoading,
    error: clientsError,
  } = useClients();
  const {
    employees,
    isLoading: employeesLoading,
    error: employeesError,
  } = useEmployees();
  const {
    categories: expenseCategories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useExpenseCategories();
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Tasks and expenses state
  const [tasks, setTasks] = useState<
    Array<CreateJobTaskData & { tempId: string }>
  >([]);
  const [expenses, setExpenses] = useState<
    Array<CreateJobExpenseData & { tempId: string }>
  >([]);

  // Get tomorrow's date as default visit date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultVisitDate = tomorrow.toISOString().split("T")[0];

  const form = useForm<CreateJobCardData>({
    defaultValues: {
      clientId: "",
      visitDate: defaultVisitDate,
      location: undefined,
      contactPerson: undefined,
      purpose: undefined,
      workSummary: undefined,
      status: "DRAFT",
      supportStaffId: undefined,
    },
  });

  const onSubmit = async (data: CreateJobCardData) => {
    // Clear previous validation errors
    setValidationErrors([]);

    // Validate tasks
    const errors: string[] = [];

    // Check if at least one task is present
    if (tasks.length === 0) {
      errors.push("At least one task is required");
    }

    // If there are validation errors, show them and stop submission
    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Clean up empty strings to null
      const cleanedData: CreateJobCardData = {
        ...data,
        visitDate: new Date(data.visitDate).toISOString(),
        location:
          data.location && data.location.trim() !== "" ? data.location : null,
        contactPerson:
          data.contactPerson && data.contactPerson.trim() !== ""
            ? data.contactPerson
            : null,
        purpose:
          data.purpose && data.purpose.trim() !== "" ? data.purpose : null,
        workSummary:
          data.workSummary && data.workSummary.trim() !== ""
            ? data.workSummary
            : null,
        supportStaffId: data.supportStaffId,
      };
      // Prepare tasks and expenses data
      const tasksData = tasks.map((task) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tempId: _tempId, ...taskData } = task;
        return taskData;
      });

      const expensesData = expenses.map((expense) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tempId: _tempId, ...expenseData } = expense;
        return expenseData;
      });

      // Create job card with tasks and expenses in one request
      await dispatch(
        createJobCard({
          ...cleanedData,
          tasks: tasksData.length > 0 ? tasksData : undefined,
          expenses: expensesData.length > 0 ? expensesData : undefined,
        })
      ).unwrap();

      form.reset();
      setTasks([]);
      setExpenses([]);
      onSuccess();
    } catch {
      // Error is handled by Redux state
    } finally {
      setIsLoading(false);
    }
  };

  // Task management functions
  const addTask = () => {
    setTasks([
      ...tasks,
      {
        tempId: `temp-${Date.now()}`,
        moduleName: null,
        taskType: null,
        description: "",
        startTime: null,
        endTime: null,
      },
    ]);
  };

  const updateTask = (
    tempId: string,
    field: keyof Omit<CreateJobTaskData, "jobCardId">,
    value: string | null
  ) => {
    setTasks(
      tasks.map((task) =>
        task.tempId === tempId ? { ...task, [field]: value } : task
      )
    );
  };

  const removeTask = (tempId: string) => {
    setTasks(tasks.filter((task) => task.tempId !== tempId));
  };

  // Expense management functions
  const addExpense = () => {
    setExpenses([
      ...expenses,
      {
        tempId: `temp-${Date.now()}`,
        category: "",
        description: null,
        amount: "",
        hasReceipt: false,
        receiptUrl: null,
      },
    ]);
  };

  const updateExpense = (
    tempId: string,
    field: keyof CreateJobExpenseData,
    value: string | number | boolean | null
  ) => {
    setExpenses(
      expenses.map((expense) =>
        expense.tempId === tempId ? { ...expense, [field]: value } : expense
      )
    );
  };

  const removeExpense = (tempId: string) => {
    setExpenses(expenses.filter((expense) => expense.tempId !== tempId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Create New Job Card</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new job card.
          </DialogDescription>
        </DialogHeader>
        {(clientsError || employeesError || categoriesError) && (
          <Alert variant="destructive" className="mx-6">
            <AlertDescription className="font-medium text-red-500">
              {clientsError || employeesError || categoriesError}
            </AlertDescription>
          </Alert>
        )}
        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="mx-6">
            <AlertDescription>
              <div className="font-medium text-red-500 mb-2">
                Please fix the following errors:
              </div>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm text-red-500">
                    {error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Client - Required */}
            <FormField
              control={form.control}
              name="clientId"
              rules={{ required: "Client is required" }}
              render={({ field }) => {
                const clientOptions: SelectOption[] = clients.map((client) => ({
                  value: client.id,
                  label: client.companyName,
                }));
                return (
                  <FormItem>
                    <FormLabel>Client *</FormLabel>
                    <Select<SelectOption>
                      instanceId="jobcard-client-select"
                      options={clientOptions}
                      value={clientOptions.find((opt) => opt.value === field.value) || null}
                      onChange={(option) => field.onChange(option?.value || null)}
                      placeholder="Select client"
                      isDisabled={isLoading || clientsLoading}
                      isLoading={clientsLoading}
                      isClearable={false}
                      isSearchable
                      styles={{
                        control: (base) => ({ ...base, minHeight: "44px" }),
                        menu: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                    <FormMessage className="text-red-500" />
                  </FormItem>
                );
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Visit Date - Required */}
              <FormField
                control={form.control}
                name="visitDate"
                rules={{ required: "Visit date is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visit Date *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={isLoading}
                        className="h-11"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => {
                  const statusOptions: SelectOption[] = [
                    { value: "DRAFT", label: "Draft" },
                    { value: "IN_PROGRESS", label: "In Progress" },
                    { value: "PENDING_CLIENT_CONFIRMATION", label: "Pending Confirmation" },
                    { value: "COMPLETED", label: "Completed" },
                    { value: "CANCELLED", label: "Cancelled" },
                  ];
                  return (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select<SelectOption>
                        instanceId="jobcard-status-select"
                        options={statusOptions}
                        value={statusOptions.find((opt) => opt.value === field.value) || null}
                        onChange={(option) => field.onChange(option?.value || null)}
                        placeholder="Select status"
                        isDisabled={isLoading}
                        isClearable={false}
                        isSearchable
                        styles={{
                          control: (base) => ({ ...base, minHeight: "44px" }),
                          menu: (base) => ({ ...base, zIndex: 9999 }),
                        }}
                      />
                      <FormMessage className="text-red-500" />
                    </FormItem>
                  );
                }}
              />
            </div>

            {/* Purpose */}
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., POS Training + Printer Setup"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location */}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Override client default location"
                        disabled={isLoading}
                        className="h-11"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />

              {/* Contact Person */}
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contact person name"
                        disabled={isLoading}
                        className="h-11"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>

            {/* Support Staff */}
            <FormField
              control={form.control}
              name="supportStaffId"
              rules={{ required: "Support staff is required" }}
              render={({ field }) => {
                const employeeOptions: SelectOption[] = employees.map((emp) => ({
                  value: emp.id,
                  label: `${emp.firstName} ${emp.lastName}`,
                }));
                return (
                  <FormItem>
                    <FormLabel>Support Staff *</FormLabel>
                    <Select<SelectOption>
                      instanceId="jobcard-staff-select"
                      options={employeeOptions}
                      value={employeeOptions.find((opt) => opt.value === field.value) || null}
                      onChange={(option) => field.onChange(option?.value || null)}
                      placeholder="Select staff"
                      isDisabled={isLoading || employeesLoading}
                      isLoading={employeesLoading}
                      isClearable={false}
                      isSearchable
                      styles={{
                        control: (base) => ({ ...base, minHeight: "44px" }),
                        menu: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                    <FormMessage className="text-red-500" />
                  </FormItem>
                );
              }}
            />

            <Separator className="my-6" />

            {/* Tasks Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Tasks *</h3>
                  <p className="text-sm text-muted-foreground">
                    Add tasks performed during this job (at least one task is
                    required)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTask}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                  No tasks added yet. Click &quot;Add Task&quot; to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks.map((task, index) => (
                    <div
                      key={task.tempId}
                      className="border rounded-lg p-4 space-y-3 bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">
                          Task {index + 1}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTask(task.tempId)}
                          disabled={isLoading}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Module Name
                          </label>
                          <Input
                            placeholder="e.g., POS System"
                            value={task.moduleName ?? ""}
                            onChange={(e) =>
                              updateTask(
                                task.tempId,
                                "moduleName",
                                e.target.value || null
                              )
                            }
                            disabled={isLoading}
                            className="h-9"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Task Type
                          </label>
                          <Input
                            placeholder="e.g., Installation"
                            value={task.taskType ?? ""}
                            onChange={(e) =>
                              updateTask(
                                task.tempId,
                                "taskType",
                                e.target.value || null
                              )
                            }
                            disabled={isLoading}
                            className="h-9"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator className="my-6" />

            {/* Expenses Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Expenses</h3>
                  <p className="text-sm text-muted-foreground">
                    Add expenses incurred during this job
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addExpense}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Expense
                </Button>
              </div>

              {expenses.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                  No expenses added yet. Click &quot;Add Expense&quot; to get
                  started.
                </div>
              ) : (
                <div className="space-y-4">
                  {expenses.map((expense, index) => (
                    <div
                      key={expense.tempId}
                      className="border rounded-lg p-4 space-y-3 bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">
                          Expense {index + 1}
                        </h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeExpense(expense.tempId)}
                          disabled={isLoading}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Category *
                          </label>
                          <Select<SelectOption>
                            instanceId={`expense-category-${expense.tempId}`}
                            options={expenseCategories
                              .filter((cat) => cat.status === "active")
                              .map((category) => ({
                                value: category.name,
                                label: category.name,
                              }))}
                            value={expenseCategories
                              .filter((cat) => cat.status === "active")
                              .map((category) => ({
                                value: category.name,
                                label: category.name,
                              }))
                              .find((opt) => opt.value === expense.category) || null}
                            onChange={(option) =>
                              updateExpense(expense.tempId, "category", option?.value || "")
                            }
                            placeholder="Select category"
                            isDisabled={isLoading || categoriesLoading}
                            isLoading={categoriesLoading}
                            isClearable={false}
                            isSearchable
                            styles={{
                              control: (base) => ({ ...base, minHeight: "36px" }),
                              menu: (base) => ({ ...base, zIndex: 9999 }),
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Amount *
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={expense.amount}
                            onChange={(e) =>
                              updateExpense(
                                expense.tempId,
                                "amount",
                                e.target.value
                              )
                            }
                            disabled={isLoading}
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`receipt-${expense.tempId}`}
                          checked={expense.hasReceipt}
                          onCheckedChange={(checked) =>
                            updateExpense(
                              expense.tempId,
                              "hasReceipt",
                              checked === true
                            )
                          }
                          disabled={isLoading}
                        />
                        <label
                          htmlFor={`receipt-${expense.tempId}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Has Receipt
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Work Summary */}
            <FormField
              control={form.control}
              name="workSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Work Summary</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Overall work done summary..."
                      disabled={isLoading}
                      rows={3}
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Job Card"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
