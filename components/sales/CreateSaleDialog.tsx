"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/lib/hooks";
import { createSale } from "@/lib/slices/saleSlice";
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
import { useProducts } from "@/lib/hooks/useProducts";
import type {
  CreateSaleData,
  CreateSaleItemData,
} from "@/lib/services/saleService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface CreateSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateSaleDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateSaleDialogProps) {
  const dispatch = useAppDispatch();
  const {
    clients,
    isLoading: clientsLoading,
    error: clientsError,
  } = useClients();
  const {
    products,
    isLoading: productsLoading,
    error: productsError,
  } = useProducts();
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Sale items state
  const [items, setItems] = useState<
    Array<CreateSaleItemData & { tempId: string }>
  >([]);

  // First installment (optional) – e.g. deposit paid when creating the sale
  const today = new Date();
  const defaultSaleDate = today.toISOString().split("T")[0];
  const [firstInstallmentAmount, setFirstInstallmentAmount] = useState("");
  const [firstInstallmentDate, setFirstInstallmentDate] = useState(
    today.toISOString().split("T")[0]
  );
  const [firstInstallmentNotes, setFirstInstallmentNotes] = useState("");

  const form = useForm<CreateSaleData>({
    defaultValues: {
      clientId: "",
      saleDate: defaultSaleDate,
      status: "DRAFT",
      agreedMonthlyInstallmentAmount: undefined,
      notes: undefined,
    },
  });

  const onSubmit = async (data: CreateSaleData) => {
    // Clear previous validation errors
    setValidationErrors([]);

    // Validate items
    const errors: string[] = [];

    // Check if at least one item is present
    if (items.length === 0) {
      errors.push("At least one sale item is required");
    }

    // Validate each item
    items.forEach((item, index) => {
      if (!item.productId) {
        errors.push(`Item ${index + 1}: Product is required`);
      }
      if (!item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1}: Quantity must be greater than 0`);
      }
      if (!item.unitPrice || Number(item.unitPrice) <= 0) {
        errors.push(`Item ${index + 1}: Unit price must be greater than 0`);
      }
    });

    // Validate first installment if provided
    const firstAmount = firstInstallmentAmount.trim()
      ? Number(firstInstallmentAmount)
      : 0;
    if (firstAmount > 0 && items.length > 0) {
      const grandTotal = items.reduce(
        (sum, item) => sum + item.quantity * Number(item.unitPrice),
        0
      );
      if (firstAmount > grandTotal) {
        errors.push(
          "First installment amount cannot exceed the sale total (Grand Total)"
        );
      }
    }
    if (errors.length > 0) {
      setValidationErrors(errors);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Clean up empty strings to null
      const cleanedData: CreateSaleData = {
        ...data,
        saleDate: new Date(data.saleDate).toISOString(),
        agreedMonthlyInstallmentAmount:
          data.agreedMonthlyInstallmentAmount != null &&
            String(data.agreedMonthlyInstallmentAmount).trim() !== ""
            ? String(data.agreedMonthlyInstallmentAmount)
            : undefined,
        notes: data.notes && data.notes.trim() !== "" ? data.notes : null,
      };

      // Prepare items data
      const itemsData = items.map((item) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tempId: _tempId, ...itemData } = item;
        return {
          ...itemData,
          unitPrice: item.unitPrice.toString(),
        };
      });

      // Optional first installment (e.g. deposit paid at creation)
      const firstAmount = firstInstallmentAmount.trim()
        ? Number(firstInstallmentAmount)
        : 0;
      const firstInstallment =
        firstAmount > 0
          ? {
            amount: firstAmount,
            paidAt: firstInstallmentDate || new Date().toISOString(),
            notes:
              firstInstallmentNotes.trim() || undefined,
          }
          : undefined;

      await dispatch(
        createSale({
          ...cleanedData,
          items: itemsData,
          ...(firstInstallment && { firstInstallment }),
        })
      ).unwrap();

      form.reset();
      setItems([]);
      setFirstInstallmentAmount("");
      setFirstInstallmentDate(new Date().toISOString().split("T")[0]);
      setFirstInstallmentNotes("");
      onSuccess();
    } catch {
      // Error is handled by Redux state
    } finally {
      setIsLoading(false);
    }
  };

  // Item management functions
  const addItem = () => {
    setItems([
      ...items,
      {
        tempId: `temp-${Date.now()}`,
        productId: "",
        quantity: 1,
        unitPrice: "0",
        totalPrice: "0",
      },
    ]);
  };

  const updateItem = (
    tempId: string,
    field: keyof Omit<CreateSaleItemData, "saleId">,
    value: string | number
  ) => {
    setItems(
      items.map((item) => {
        if (item.tempId === tempId) {
          const updatedItem = { ...item, [field]: value };
          // Recalculate totalPrice when quantity or unitPrice changes
          if (field === "quantity" || field === "unitPrice") {
            updatedItem.totalPrice = (
              updatedItem.quantity * Number(updatedItem.unitPrice)
            ).toFixed(2);
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const removeItem = (tempId: string) => {
    setItems(items.filter((item) => item.tempId !== tempId));
  };

  // Calculate total for an item
  const calculateItemTotal = (quantity: number, unitPrice: string) => {
    return (quantity * Number(unitPrice)).toFixed(2);
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => {
      return sum + item.quantity * Number(item.unitPrice);
    }, 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle>Create New Sale</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new sale.
          </DialogDescription>
        </DialogHeader>
        {(clientsError || productsError) && (
          <Alert variant="destructive" className="mx-6">
            <AlertDescription className="font-medium text-red-500">
              {clientsError || productsError}
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
                      instanceId="sale-client-select"
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
              {/* Sale Date - Required */}
              <FormField
                control={form.control}
                name="saleDate"
                rules={{ required: "Sale date is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Date *</FormLabel>
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
                    { value: "PENDING", label: "Pending" },
                    { value: "COMPLETED", label: "Completed" },
                  ];
                  return (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select<SelectOption>
                        instanceId="sale-status-select"
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

              {/* Agreed monthly installment (optional) */}
              <FormField
                control={form.control}
                name="agreedMonthlyInstallmentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agreed monthly installment (KES)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Optional – e.g. 5000"
                        disabled={isLoading}
                        className="h-11"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : e.target.value
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage className="text-red-500" />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-6" />

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Sale Items *</h3>
                  <p className="text-sm text-muted-foreground">
                    Add products to this sale (at least one item is required)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
                  No items added yet. Click &quot;Add Item&quot; to get started.
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item, index) => {
                    const selectedProduct = products.find(
                      (p) => p.id === item.productId
                    );
                    return (
                      <div
                        key={item.tempId}
                        className="border rounded-lg p-4 space-y-3 bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">
                            Item {index + 1}
                          </h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.tempId)}
                            disabled={isLoading}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              Product *
                            </label>
                            <Select<SelectOption>
                              instanceId={`product-select-${item.tempId}`}
                              options={products.map((product) => ({
                                value: product.id,
                                label: product.name,
                              }))}
                              value={products.map((product) => ({
                                value: product.id,
                                label: product.name,
                              })).find((opt) => opt.value === item.productId) || null}
                              onChange={(option) =>
                                updateItem(item.tempId, "productId", option?.value || "")
                              }
                              placeholder="Select product"
                              isDisabled={isLoading || productsLoading}
                              isLoading={productsLoading}
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
                              Quantity *
                            </label>
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(
                                  item.tempId,
                                  "quantity",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              disabled={isLoading}
                              className="h-9"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">
                              Unit Price (KES) *
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateItem(
                                  item.tempId,
                                  "unitPrice",
                                  e.target.value
                                )
                              }
                              disabled={isLoading}
                              className="h-9"
                            />
                          </div>
                        </div>
                        {selectedProduct && (
                          <div className="text-sm text-muted-foreground">
                            Total: KES{" "}
                            {calculateItemTotal(item.quantity, item.unitPrice)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Grand Total */}
              {items.length > 0 && (
                <div className="flex justify-end pt-4 border-t">
                  <div className="text-lg font-semibold">
                    Grand Total: KES{" "}
                    {calculateGrandTotal().toLocaleString("en-KE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* First installment (optional) */}
            {items.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      First installment (optional)
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      If the client is paying an initial amount now (e.g.
                      deposit), enter it here.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Amount (KES)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 5000"
                        value={firstInstallmentAmount}
                        onChange={(e) =>
                          setFirstInstallmentAmount(e.target.value)
                        }
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Date paid
                      </label>
                      <Input
                        type="date"
                        value={firstInstallmentDate}
                        onChange={(e) =>
                          setFirstInstallmentDate(e.target.value)
                        }
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">
                        Notes
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g. Deposit"
                        value={firstInstallmentNotes}
                        onChange={(e) =>
                          setFirstInstallmentNotes(e.target.value)
                        }
                        disabled={isLoading}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this sale..."
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
                  "Create Sale"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
