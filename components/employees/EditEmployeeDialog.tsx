"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/lib/hooks";
import { updateEmployee } from "@/lib/slices/employeeSlice";
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
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Select from "react-select";
import { Loader2 } from "lucide-react";
import { useRoles } from "@/lib/hooks/useRoles";
import type { EmployeeWithoutPassword } from "@/lib/types";
import type { UpdateEmployeeData } from "@/lib/services/employeeService";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SelectOption {
  value: string;
  label: string;
}

interface EditEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: EmployeeWithoutPassword;
  onSuccess: () => void;
}

export function EditEmployeeDialog({
  open,
  onOpenChange,
  employee,
  onSuccess,
}: EditEmployeeDialogProps) {
  const dispatch = useAppDispatch();
  const { roles, isLoading: rolesLoading, error: rolesError } = useRoles();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UpdateEmployeeData>({
    defaultValues: {
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      position: employee.position ?? undefined,
      department: employee.department ?? undefined,
      phone: employee.phone ?? undefined,
      roleId: employee.roleId ?? undefined,
    },
  });

  // Update form when employee changes
  useEffect(() => {
    if (employee) {
      form.reset({
        email: employee.email,
        firstName: employee.firstName,
        lastName: employee.lastName,
        position: employee.position || undefined,
        department: employee.department || undefined,
        phone: employee.phone || undefined,
        roleId: employee.roleId || undefined,
      });
    }
  }, [employee, form]);

  const onSubmit = async (data: UpdateEmployeeData) => {
    setIsLoading(true);
    try {
      // Clean up empty strings to null (to match API expectations)
      const cleanedData: UpdateEmployeeData = {
        ...data,
        position:
          data.position && data.position.trim() !== "" ? data.position : null,
        department:
          data.department && data.department.trim() !== ""
            ? data.department
            : null,
        phone: data.phone && data.phone.trim() !== "" ? data.phone : null,
        roleId:
          data.roleId && data.roleId !== ""
            ? data.roleId
            : (null as string | null | undefined),
      };
      await dispatch(
        updateEmployee({ id: employee.id, data: cleanedData })
      ).unwrap();
      onSuccess();
    } catch {
      // Error is handled by Redux state
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions: SelectOption[] = roles.map((role) => ({
    value: role.id,
    label: role.name,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update employee information. Changes will be saved immediately.
          </DialogDescription>
        </DialogHeader>
        {rolesError && (
          <Alert variant="destructive" className="mx-6">
            <AlertDescription className="font-medium text-red-500">
              {rolesError}
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                rules={{ required: "First name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <Input
                      placeholder="John"
                      disabled={isLoading}
                      {...field}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                rules={{ required: "Last name is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <Input
                      placeholder="Doe"
                      disabled={isLoading}
                      {...field}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      placeholder="john.doe@example.com"
                      disabled={isLoading}
                      {...field}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <Input
                      type="tel"
                      placeholder="+1234567890"
                      disabled={isLoading}
                      {...field}
                      value={field.value ?? ""}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position (Optional)</FormLabel>
                    <Input
                      placeholder="Software Engineer"
                      disabled={isLoading}
                      {...field}
                      value={field.value ?? ""}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department (Optional)</FormLabel>
                    <Input
                      placeholder="Engineering"
                      disabled={isLoading}
                      {...field}
                      value={field.value ?? ""}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="roleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role (Optional)</FormLabel>
                    <Select<SelectOption>
                      instanceId="edit-role-select"
                      options={roleOptions}
                      value={roleOptions.find((opt) => opt.value === field.value) || null}
                      onChange={(option) => field.onChange(option?.value || null)}
                      placeholder="Select a role (optional)"
                      isDisabled={isLoading || rolesLoading}
                      isLoading={rolesLoading}
                      isClearable
                      isSearchable
                      styles={{
                        control: (base) => ({ ...base, minHeight: "44px" }),
                        menu: (base) => ({ ...base, zIndex: 9999 }),
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Employee"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
