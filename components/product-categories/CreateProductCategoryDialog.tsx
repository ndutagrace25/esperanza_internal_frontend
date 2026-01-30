"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { createProductCategory } from "@/lib/slices/productCategorySlice";
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
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CreateProductCategoryData } from "@/lib/services/productCategoryService";

interface CreateProductCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateProductCategoryDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateProductCategoryDialogProps) {
  const dispatch = useAppDispatch();
  const { error } = useAppSelector((state) => state.productCategory);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateProductCategoryData>({
    defaultValues: {
      name: "",
      description: null,
      status: "active",
    },
  });

  const onSubmit = async (data: CreateProductCategoryData) => {
    setIsLoading(true);
    try {
      // Clean up empty strings to null
      const cleanedData: CreateProductCategoryData = {
        ...data,
        description:
          data.description && data.description.trim() !== ""
            ? data.description
            : null,
      };
      await dispatch(createProductCategory(cleanedData)).unwrap();
      form.reset();
      onSuccess();
    } catch {
      // Error is handled by Redux state
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Create New Category</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new product category.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="font-medium text-red-500">
              {error}
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Category Name - Required */}
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Category name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Software, Hardware, Services"
                      disabled={isLoading}
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Category description..."
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

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => {
                const statusOptions: SelectOption[] = [
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ];
                return (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select<SelectOption>
                      instanceId="category-status-select"
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
                );
              }}
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
                  "Create Category"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
