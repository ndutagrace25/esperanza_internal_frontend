"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/lib/hooks";
import { createClient } from "@/lib/slices/clientSlice";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Select from "react-select";
import { Loader2 } from "lucide-react";
import { useEmployees } from "@/lib/hooks/useEmployees";
import type { CreateClientData } from "@/lib/services/clientService";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SelectOption {
  value: string;
  label: string;
}

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateClientDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateClientDialogProps) {
  const dispatch = useAppDispatch();
  const {
    employees,
    isLoading: employeesLoading,
    error: employeesError,
  } = useEmployees();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateClientData>({
    defaultValues: {
      companyName: "",
      contactPerson: undefined,
      email: undefined,
      phone: undefined,
      alternatePhone: undefined,
      address: undefined,
      city: undefined,
      state: undefined,
      country: undefined,
      postalCode: undefined,
      website: undefined,
      taxId: undefined,
      backendBaseUrl: undefined,
      apiUserName: undefined,
      apiPassword: undefined,
      status: "active",
      notes: undefined,
      assignedToId: undefined,
      broughtInById: undefined,
    },
  });

  const onSubmit = async (data: CreateClientData) => {
    setIsLoading(true);
    try {
      const cleanedData: CreateClientData = {
        ...data,
        contactPerson:
          data.contactPerson && data.contactPerson.trim() !== ""
            ? data.contactPerson
            : null,
        email: data.email && data.email.trim() !== "" ? data.email : null,
        phone: data.phone && data.phone.trim() !== "" ? data.phone : null,
        alternatePhone:
          data.alternatePhone && data.alternatePhone.trim() !== ""
            ? data.alternatePhone
            : null,
        address:
          data.address && data.address.trim() !== "" ? data.address : null,
        city: data.city && data.city.trim() !== "" ? data.city : null,
        state: data.state && data.state.trim() !== "" ? data.state : null,
        country:
          data.country && data.country.trim() !== "" ? data.country : null,
        postalCode:
          data.postalCode && data.postalCode.trim() !== ""
            ? data.postalCode
            : null,
        website:
          data.website && data.website.trim() !== "" ? data.website : null,
        taxId: data.taxId && data.taxId.trim() !== "" ? data.taxId : null,
        backendBaseUrl:
          data.backendBaseUrl && data.backendBaseUrl.trim() !== ""
            ? data.backendBaseUrl
            : null,
        apiUserName:
          data.apiUserName && data.apiUserName.trim() !== ""
            ? data.apiUserName
            : null,
        apiPassword:
          data.apiPassword && data.apiPassword.trim() !== ""
            ? data.apiPassword
            : null,
        notes: data.notes && data.notes.trim() !== "" ? data.notes : null,
        assignedToId:
          data.assignedToId && data.assignedToId !== ""
            ? data.assignedToId
            : null,
        broughtInById:
          data.broughtInById && data.broughtInById !== ""
            ? data.broughtInById
            : null,
      };
      await dispatch(createClient(cleanedData)).unwrap();
      form.reset();
      onSuccess();
    } catch {
      // Error is handled by Redux state
    } finally {
      setIsLoading(false);
    }
  };

  const statusOptions: SelectOption[] = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
  ];

  const employeeOptions: SelectOption[] = employees.map((emp) => ({
    value: emp.id,
    label: `${emp.firstName} ${emp.lastName}`,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Create New Client</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new client to the system.
          </DialogDescription>
        </DialogHeader>
        {employeesError && (
          <Alert variant="destructive" className="mx-6">
            <AlertDescription className="font-medium text-red-500">
              {employeesError}
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              rules={{ required: "Company name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name *</FormLabel>
                  <Input
                    placeholder="Acme Corporation"
                    disabled={isLoading}
                    className="h-11"
                    {...field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactPerson"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <Input
                      placeholder="John Doe"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                      value={field.value ?? ""}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                rules={{
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
                      placeholder="contact@company.com"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                      value={field.value ?? ""}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <Input
                      type="tel"
                      placeholder="+1234567890"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                      value={field.value ?? ""}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alternatePhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alternate Phone</FormLabel>
                    <Input
                      type="tel"
                      placeholder="+1234567890"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                      value={field.value ?? ""}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <Input
                    placeholder="123 Main Street"
                    disabled={isLoading}
                    className="h-11"
                    {...field}
                    value={field.value ?? ""}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <Input
                      placeholder="New York"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                      value={field.value ?? ""}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province</FormLabel>
                    <Input
                      placeholder="NY"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                      value={field.value ?? ""}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Input
                      placeholder="United States"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                      value={field.value ?? ""}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code</FormLabel>
                    <Input
                      placeholder="10001"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                      value={field.value ?? ""}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <Input
                      type="url"
                      placeholder="https://www.company.com"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                      value={field.value ?? ""}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax ID / VAT Number</FormLabel>
                    <Input
                      placeholder="TAX-123456"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                      value={field.value ?? ""}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                API credentials (for license extension)
              </p>
              <FormField
                control={form.control}
                name="backendBaseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Backend base URL</FormLabel>
                    <Input
                      type="url"
                      placeholder="https://client-system.example.com"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                      value={field.value ?? ""}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="apiUserName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API username</FormLabel>
                      <Input
                        placeholder="API login username"
                        disabled={isLoading}
                        className="h-11"
                        {...field}
                        value={field.value ?? ""}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="apiPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API password</FormLabel>
                      <Input
                        type="password"
                        placeholder="API login password"
                        disabled={isLoading}
                        className="h-11"
                        {...field}
                        value={field.value ?? ""}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select<SelectOption>
                      instanceId="client-status-select"
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned To</FormLabel>
                    <Select<SelectOption>
                      instanceId="client-assigned-select"
                      options={employeeOptions}
                      value={employeeOptions.find((opt) => opt.value === field.value) || null}
                      onChange={(option) => field.onChange(option?.value || null)}
                      placeholder="Select employee (optional)"
                      isDisabled={isLoading || employeesLoading}
                      isLoading={employeesLoading}
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

            <FormField
              control={form.control}
              name="broughtInById"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brought In By</FormLabel>
                  <Select<SelectOption>
                    instanceId="client-broughtin-select"
                    options={employeeOptions}
                    value={employeeOptions.find((opt) => opt.value === field.value) || null}
                    onChange={(option) => field.onChange(option?.value || null)}
                    placeholder="Select employee (optional)"
                    isDisabled={isLoading || employeesLoading}
                    isLoading={employeesLoading}
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

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <Textarea
                    placeholder="Additional notes about the client..."
                    disabled={isLoading}
                    rows={3}
                    {...field}
                    value={field.value ?? ""}
                  />
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
                  "Create Client"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
