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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { useClients } from "@/lib/hooks/useClients";
import { useEmployees } from "@/lib/hooks/useEmployees";
import type { CreateJobCardData } from "@/lib/services/jobCardService";
import {
  createTask,
  createExpense,
  type CreateJobTaskData,
  type CreateJobExpenseData,
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
  const [isLoading, setIsLoading] = useState(false);

  // Tasks and expenses state
  const [tasks, setTasks] = useState<
    Array<Omit<CreateJobTaskData, "jobCardId"> & { tempId: string }>
  >([]);
  const [expenses, setExpenses] = useState<
    Array<Omit<CreateJobExpenseData, "jobCardId"> & { tempId: string }>
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
      estimatedDuration: undefined,
      estimatedCost: undefined,
      startTime: undefined,
      endTime: undefined,
      workSummary: undefined,
      findings: undefined,
      recommendations: undefined,
      status: "DRAFT",
      supportStaffId: undefined,
    },
  });

  const onSubmit = async (data: CreateJobCardData) => {
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
        estimatedDuration:
          data.estimatedDuration !== undefined && data.estimatedDuration !== null
            ? data.estimatedDuration
            : null,
        estimatedCost:
          data.estimatedCost && data.estimatedCost.trim() !== ""
            ? data.estimatedCost
            : null,
        startTime: data.startTime && data.visitDate
          ? new Date(`${data.visitDate}T${data.startTime}`).toISOString()
          : null,
        endTime: data.endTime && data.visitDate
          ? new Date(`${data.visitDate}T${data.endTime}`).toISOString()
          : null,
        workSummary:
          data.workSummary && data.workSummary.trim() !== ""
            ? data.workSummary
            : null,
        findings:
          data.findings && data.findings.trim() !== "" ? data.findings : null,
        recommendations:
          data.recommendations && data.recommendations.trim() !== ""
            ? data.recommendations
            : null,
        supportStaffId:
          data.supportStaffId && data.supportStaffId !== ""
            ? data.supportStaffId
            : null,
      };
      // Create job card first
      const jobCard = await dispatch(createJobCard(cleanedData)).unwrap();

      // Create all tasks
      for (const task of tasks) {
        const { tempId, ...taskData } = task;
        await createTask(jobCard.id, taskData);
      }

      // Create all expenses
      for (const expense of expenses) {
        const { tempId, ...expenseData } = expense;
        await createExpense(jobCard.id, expenseData);
      }

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
    field: keyof Omit<CreateJobExpenseData, "jobCardId">,
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
        {(clientsError || employeesError) && (
          <Alert variant="destructive" className="mx-6">
            <AlertDescription className="font-medium text-red-500">
              {clientsError || employeesError}
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
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading || clientsLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="PENDING_CLIENT_CONFIRMATION">
                          Pending Confirmation
                        </SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
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
                  <FormMessage />
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
                    <FormMessage />
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Start Time */}
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        disabled={isLoading}
                        className="h-11"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const time = e.target.value;
                          field.onChange(time || null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End Time */}
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        disabled={isLoading}
                        className="h-11"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const time = e.target.value;
                          field.onChange(time || null);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Support Staff */}
              <FormField
                control={form.control}
                name="supportStaffId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support Staff</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value || null);
                      }}
                      value={field.value || undefined}
                      disabled={isLoading || employeesLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select staff (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.firstName} {employee.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Estimated Duration */}
              <FormField
                control={form.control}
                name="estimatedDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="120"
                        disabled={isLoading}
                        className="h-11"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? null : parseInt(value, 10));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Estimated Cost */}
              <FormField
                control={form.control}
                name="estimatedCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Cost</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        disabled={isLoading}
                        className="h-11"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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

            {/* Findings */}
            <FormField
              control={form.control}
              name="findings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Findings</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Findings from the visit..."
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

            {/* Recommendations */}
            <FormField
              control={form.control}
              name="recommendations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recommendations</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Recommendations..."
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

            <Separator className="my-6" />

            {/* Tasks Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Tasks</h3>
                  <p className="text-sm text-muted-foreground">
                    Add tasks performed during this job
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
                  No tasks added yet. Click "Add Task" to get started.
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
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Description *
                        </label>
                        <Textarea
                          placeholder="Describe the task..."
                          value={task.description}
                          onChange={(e) =>
                            updateTask(
                              task.tempId,
                              "description",
                              e.target.value
                            )
                          }
                          disabled={isLoading}
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            Start Time
                          </label>
                          <Input
                            type="time"
                            value={
                              task.startTime
                                ? new Date(task.startTime)
                                    .toTimeString()
                                    .slice(0, 5)
                                : ""
                            }
                            onChange={(e) => {
                              const time = e.target.value;
                              const visitDate = form.getValues("visitDate");
                              updateTask(
                                task.tempId,
                                "startTime",
                                time && visitDate
                                  ? new Date(
                                      `${visitDate}T${time}`
                                    ).toISOString()
                                  : null
                              );
                            }}
                            disabled={isLoading}
                            className="h-9"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">
                            End Time
                          </label>
                          <Input
                            type="time"
                            value={
                              task.endTime
                                ? new Date(task.endTime)
                                    .toTimeString()
                                    .slice(0, 5)
                                : ""
                            }
                            onChange={(e) => {
                              const time = e.target.value;
                              const visitDate = form.getValues("visitDate");
                              updateTask(
                                task.tempId,
                                "endTime",
                                time && visitDate
                                  ? new Date(
                                      `${visitDate}T${time}`
                                    ).toISOString()
                                  : null
                              );
                            }}
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
                  No expenses added yet. Click "Add Expense" to get started.
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
                          <Input
                            placeholder="e.g., Transport, Materials"
                            value={expense.category}
                            onChange={(e) =>
                              updateExpense(
                                expense.tempId,
                                "category",
                                e.target.value
                              )
                            }
                            disabled={isLoading}
                            className="h-9"
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
                      <div>
                        <label className="text-sm font-medium mb-1 block">
                          Description
                        </label>
                        <Textarea
                          placeholder="Expense description..."
                          value={expense.description ?? ""}
                          onChange={(e) =>
                            updateExpense(
                              expense.tempId,
                              "description",
                              e.target.value || null
                            )
                          }
                          disabled={isLoading}
                          rows={2}
                          className="resize-none"
                        />
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

