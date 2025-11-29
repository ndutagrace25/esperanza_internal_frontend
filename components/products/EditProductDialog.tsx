"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { updateProduct } from "@/lib/slices/productSlice";
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
import { Loader2 } from "lucide-react";
import { useProductCategories } from "@/lib/hooks/useProductCategories";
import type { Product } from "@/lib/types";
import type { UpdateProductData } from "@/lib/services/productService";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onSuccess: () => void;
}

export function EditProductDialog({
  open,
  onOpenChange,
  product,
  onSuccess,
}: EditProductDialogProps) {
  const dispatch = useAppDispatch();
  const {
    categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useProductCategories();
  const { error: productError } = useAppSelector((state) => state.product);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UpdateProductData>({
    defaultValues: {
      name: product.name,
      description: product.description ?? undefined,
      sku: product.sku ?? undefined,
      barcode: product.barcode ?? undefined,
      categoryId: product.categoryId ?? undefined,
      status: product.status,
      notes: product.notes ?? undefined,
    },
  });

  // Update form when product changes
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description ?? undefined,
        sku: product.sku ?? undefined,
        barcode: product.barcode ?? undefined,
        categoryId: product.categoryId ?? undefined,
        status: product.status,
        notes: product.notes ?? undefined,
      });
    }
  }, [product, form]);

  const onSubmit = async (data: UpdateProductData) => {
    setIsLoading(true);
    try {
      // Clean up empty strings to null
      const cleanedData: UpdateProductData = {
        ...data,
        description:
          data.description && data.description.trim() !== ""
            ? data.description
            : null,
        sku: data.sku && data.sku.trim() !== "" ? data.sku : null,
        barcode:
          data.barcode && data.barcode.trim() !== "" ? data.barcode : null,
        // categoryId is required, ensure it's a string
        categoryId:
          data.categoryId && data.categoryId !== ""
            ? data.categoryId
            : undefined,
        notes: data.notes && data.notes.trim() !== "" ? data.notes : null,
      };
      await dispatch(
        updateProduct({ id: product.id, data: cleanedData })
      ).unwrap();
      onSuccess();
    } catch {
      // Error is handled by Redux state
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the product details below.
          </DialogDescription>
        </DialogHeader>
        {(categoriesError || productError) && (
          <Alert variant="destructive" className="mx-6">
            <AlertDescription className="font-medium text-red-500">
              {categoriesError || productError}
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Product Name - Required */}
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Product name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Product Name"
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
                      placeholder="Product description..."
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SKU */}
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU (Stock Keeping Unit)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="SKU-12345 (optional)"
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

              {/* Barcode */}
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode / EAN</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="1234567890123 (optional)"
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <FormField
                control={form.control}
                name="categoryId"
                rules={{ required: "Category is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                      disabled={isLoading || categoriesLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white">
                        {categories
                          .filter((cat) => cat.status === "active")
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="discontinued">
                          Discontinued
                        </SelectItem>
                        <SelectItem value="out_of_stock">
                          Out of Stock
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the product..."
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
                    Updating...
                  </>
                ) : (
                  "Update Product"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
