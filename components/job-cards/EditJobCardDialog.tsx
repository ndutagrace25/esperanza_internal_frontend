"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/lib/hooks";
import { updateJobCard } from "@/lib/slices/jobCardSlice";
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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useClients } from "@/lib/hooks/useClients";
import { useEmployees } from "@/lib/hooks/useEmployees";
import type { JobCard, JobTask, JobExpense } from "@/lib/types";
import type {
  UpdateJobCardData,
  UpdateJobTaskData,
  UpdateJobExpenseData,
} from "@/lib/services/jobCardService";
import {
  createTask,
  updateTask,
  deleteTask,
  createExpense,
  updateExpense,
  deleteExpense,
} from "@/lib/services/jobCardService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

interface EditJobCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobCard: JobCard;
  onSuccess: () => void;
}

export function EditJobCardDialog({
  open,
  onOpenChange,
  jobCard,
  onSuccess,
}: EditJobCardDialogProps) {
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
  // Track existing tasks/expenses (with id) and new ones (with tempId)
  type TaskItem =
    | JobTask
    | (Omit<JobTask, "id" | "jobCardId" | "createdAt" | "updatedAt"> & {
        tempId: string;
        isNew: true;
      });
  type ExpenseItem =
    | JobExpense
    | (Omit<JobExpense, "id" | "jobCardId" | "createdAt" | "updatedAt"> & {
        tempId: string;
        isNew: true;
      });

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [deletedTaskIds, setDeletedTaskIds] = useState<string[]>([]);
  const [deletedExpenseIds, setDeletedExpenseIds] = useState<string[]>([]);

  // Format dates for input fields
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const formatTimeForInput = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toTimeString().slice(0, 5); // HH:MM format
  };

  const form = useForm<UpdateJobCardData>({
    defaultValues: {
      clientId: jobCard.clientId,
      visitDate: formatDateForInput(jobCard.visitDate),
      location: jobCard.location ?? undefined,
      contactPerson: jobCard.contactPerson ?? undefined,
      purpose: jobCard.purpose ?? undefined,
      estimatedDuration: jobCard.estimatedDuration ?? undefined,
      estimatedCost: jobCard.estimatedCost ?? undefined,
      startTime: formatTimeForInput(jobCard.startTime),
      endTime: formatTimeForInput(jobCard.endTime),
      workSummary: jobCard.workSummary ?? undefined,
      findings: jobCard.findings ?? undefined,
      recommendations: jobCard.recommendations ?? undefined,
      status: jobCard.status,
      supportStaffId: jobCard.supportStaffId ?? undefined,
    },
  });

  // Update form and tasks/expenses when jobCard changes
  useEffect(() => {
    if (jobCard) {
      form.reset({
        clientId: jobCard.clientId,
        visitDate: formatDateForInput(jobCard.visitDate),
        location: jobCard.location ?? undefined,
        contactPerson: jobCard.contactPerson ?? undefined,
        purpose: jobCard.purpose ?? undefined,
        estimatedDuration: jobCard.estimatedDuration ?? undefined,
        estimatedCost: jobCard.estimatedCost ?? undefined,
        startTime: formatTimeForInput(jobCard.startTime),
        endTime: formatTimeForInput(jobCard.endTime),
        workSummary: jobCard.workSummary ?? undefined,
        findings: jobCard.findings ?? undefined,
        recommendations: jobCard.recommendations ?? undefined,
        status: jobCard.status,
        supportStaffId: jobCard.supportStaffId ?? undefined,
      });
      // Load existing tasks and expenses
      setTasks(jobCard.tasks || []);
      setExpenses(jobCard.expenses || []);
      setDeletedTaskIds([]);
      setDeletedExpenseIds([]);
    }
  }, [jobCard, form]);

  const onSubmit = async (data: UpdateJobCardData) => {
    setIsLoading(true);
    try {
      // Clean up empty strings to null and format dates
      const cleanedData: UpdateJobCardData = {
        ...data,
        visitDate: data.visitDate
          ? new Date(data.visitDate).toISOString()
          : undefined,
        location:
          data.location && data.location.trim() !== "" ? data.location : null,
        contactPerson:
          data.contactPerson && data.contactPerson.trim() !== ""
            ? data.contactPerson
            : null,
        purpose:
          data.purpose && data.purpose.trim() !== "" ? data.purpose : null,
        estimatedDuration:
          data.estimatedDuration !== undefined &&
          data.estimatedDuration !== null
            ? data.estimatedDuration
            : null,
        estimatedCost:
          data.estimatedCost && data.estimatedCost.trim() !== ""
            ? data.estimatedCost
            : null,
        startTime:
          data.startTime && data.visitDate
            ? new Date(`${data.visitDate}T${data.startTime}:00`).toISOString()
            : null,
        endTime:
          data.endTime && data.visitDate
            ? new Date(`${data.visitDate}T${data.endTime}:00`).toISOString()
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
      // Update job card
      await dispatch(
        updateJobCard({ id: jobCard.id, data: cleanedData })
      ).unwrap();

      // Delete removed tasks
      for (const taskId of deletedTaskIds) {
        await deleteTask(taskId);
      }

      // Delete removed expenses
      for (const expenseId of deletedExpenseIds) {
        await deleteExpense(expenseId);
      }

      // Update existing tasks and create new ones
      for (const task of tasks) {
        if ("isNew" in task && task.isNew) {
          // New task - create it
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { tempId: _tempId, isNew: _isNew, ...taskData } = task;
          await createTask(jobCard.id, taskData);
        } else if ("id" in task) {
          // Existing task - update it
          const updateData: UpdateJobTaskData = {
            moduleName: task.moduleName,
            taskType: task.taskType,
            description: task.description,
            startTime: task.startTime,
            endTime: task.endTime,
          };
          await updateTask(task.id, updateData);
        }
      }

      // Update existing expenses and create new ones
      for (const expense of expenses) {
        if ("isNew" in expense && expense.isNew) {
          // New expense - create it
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { tempId: _tempId, isNew: _isNew, ...expenseData } = expense;
          await createExpense(jobCard.id, expenseData);
        } else if ("id" in expense) {
          // Existing expense - update it
          const updateData: UpdateJobExpenseData = {
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            hasReceipt: expense.hasReceipt,
            receiptUrl: expense.receiptUrl,
          };
          await updateExpense(expense.id, updateData);
        }
      }

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
        isNew: true,
        moduleName: null,
        taskType: null,
        description: "",
        startTime: null,
        endTime: null,
      },
    ]);
  };

  const updateTaskField = (
    taskIdOrTempId: string,
    field: keyof Omit<JobTask, "id" | "jobCardId" | "createdAt" | "updatedAt">,
    value: string | null
  ) => {
    setTasks(
      tasks.map((task) => {
        const id =
          "isNew" in task && task.isNew
            ? task.tempId
            : "id" in task
            ? task.id
            : "";
        if (id === taskIdOrTempId) {
          return { ...task, [field]: value };
        }
        return task;
      })
    );
  };

  const removeTask = (taskIdOrTempId: string) => {
    const task = tasks.find(
      (t) =>
        ("isNew" in t && t.isNew ? t.tempId : "id" in t ? t.id : "") ===
        taskIdOrTempId
    );
    if (task && "id" in task) {
      // Existing task - mark for deletion
      setDeletedTaskIds([...deletedTaskIds, task.id]);
    }
    setTasks(
      tasks.filter((t) => {
        const id = "isNew" in t && t.isNew ? t.tempId : "id" in t ? t.id : "";
        return id !== taskIdOrTempId;
      })
    );
  };

  // Expense management functions
  const addExpense = () => {
    setExpenses([
      ...expenses,
      {
        tempId: `temp-${Date.now()}`,
        isNew: true,
        category: "",
        description: null,
        amount: "",
        hasReceipt: false,
        receiptUrl: null,
      },
    ]);
  };

  const updateExpenseField = (
    expenseIdOrTempId: string,
    field: keyof Omit<
      JobExpense,
      "id" | "jobCardId" | "createdAt" | "updatedAt"
    >,
    value: string | number | boolean | null
  ) => {
    setExpenses(
      expenses.map((expense) => {
        const id =
          "isNew" in expense && expense.isNew
            ? expense.tempId
            : "id" in expense
            ? expense.id
            : "";
        if (id === expenseIdOrTempId) {
          return { ...expense, [field]: value };
        }
        return expense;
      })
    );
  };

  const removeExpense = (expenseIdOrTempId: string) => {
    const expense = expenses.find(
      (e) =>
        ("isNew" in e && e.isNew ? e.tempId : "id" in e ? e.id : "") ===
        expenseIdOrTempId
    );
    if (expense && "id" in expense) {
      // Existing expense - mark for deletion
      setDeletedExpenseIds([...deletedExpenseIds, expense.id]);
    }
    setExpenses(
      expenses.filter((e) => {
        const id = "isNew" in e && e.isNew ? e.tempId : "id" in e ? e.id : "";
        return id !== expenseIdOrTempId;
      })
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Edit Job Card</DialogTitle>
          <DialogDescription>
            Update the job card details below.
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
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const time = e.target.value;
                          const date = form.getValues("visitDate");
                          if (time && date) {
                            field.onChange(time);
                          } else {
                            field.onChange(null);
                          }
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
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const time = e.target.value;
                          const date = form.getValues("visitDate");
                          if (time && date) {
                            field.onChange(time);
                          } else {
                            field.onChange(null);
                          }
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
                          field.onChange(
                            value === "" ? null : parseInt(value, 10)
                          );
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
                    Manage tasks performed during this job
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
                  {tasks.map((task, index) => {
                    const taskId =
                      "isNew" in task && task.isNew
                        ? task.tempId
                        : "id" in task
                        ? task.id
                        : "";
                    return (
                      <div
                        key={taskId}
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
                            onClick={() => removeTask(taskId)}
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
                                updateTaskField(
                                  taskId,
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
                                updateTaskField(
                                  taskId,
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
                              updateTaskField(
                                taskId,
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
                                updateTaskField(
                                  taskId,
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
                                updateTaskField(
                                  taskId,
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
                    );
                  })}
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
                    Manage expenses incurred during this job
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
                  {expenses.map((expense, index) => {
                    const expenseId =
                      "isNew" in expense && expense.isNew
                        ? expense.tempId
                        : "id" in expense
                        ? expense.id
                        : "";
                    return (
                      <div
                        key={expenseId}
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
                            onClick={() => removeExpense(expenseId)}
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
                                updateExpenseField(
                                  expenseId,
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
                                updateExpenseField(
                                  expenseId,
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
                              updateExpenseField(
                                expenseId,
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
                            id={`receipt-${expenseId}`}
                            checked={expense.hasReceipt}
                            onCheckedChange={(checked) =>
                              updateExpenseField(
                                expenseId,
                                "hasReceipt",
                                checked === true
                              )
                            }
                            disabled={isLoading}
                          />
                          <label
                            htmlFor={`receipt-${expenseId}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Has Receipt
                          </label>
                        </div>
                      </div>
                    );
                  })}
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
                    Updating...
                  </>
                ) : (
                  "Update Job Card"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
