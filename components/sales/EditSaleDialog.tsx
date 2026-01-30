"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/lib/hooks";
import { updateSale } from "@/lib/slices/saleSlice";
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
import type { Sale } from "@/lib/types";
import type {
  UpdateSaleData,
  UpdateSaleItemData,
} from "@/lib/services/saleService";
import {
  createSaleItem,
  updateSaleItem,
  deleteSaleItem,
} from "@/lib/services/saleService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

interface EditSaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale;
  onSuccess: () => void;
}

export function EditSaleDialog({
  open,
  onOpenChange,
  sale,
  onSuccess,
}: EditSaleDialogProps) {
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

  // Sale items state
  // Track existing items (with id) and new ones (with tempId)
  type ItemItem =
    | Sale["items"][0]
    | (Omit<
      Sale["items"][0],
      "id" | "saleId" | "createdAt" | "updatedAt" | "product"
    > & {
      tempId: string;
      isNew: true;
      productId: string;
      product: {
        id: string;
        name: string;
        description: string | null;
        sku: string | null;
        barcode: string | null;
      };
    });

  const [items, setItems] = useState<ItemItem[]>([]);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);

  // Format dates for input fields
  const formatDateForInput = (dateString: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const form = useForm<UpdateSaleData>({
    defaultValues: {
      clientId: sale.clientId,
      saleDate: formatDateForInput(sale.saleDate),
      status: sale.status,
      agreedMonthlyInstallmentAmount: sale.agreedMonthlyInstallmentAmount ?? undefined,
      notes: sale.notes ?? undefined,
    },
  });

  // Update form and items when sale changes
  useEffect(() => {
    if (sale) {
      form.reset({
        clientId: sale.clientId,
        saleDate: formatDateForInput(sale.saleDate),
        status: sale.status,
        agreedMonthlyInstallmentAmount: sale.agreedMonthlyInstallmentAmount ?? undefined,
        notes: sale.notes ?? undefined,
      });
      // Load existing items
      setItems(sale.items || []);
      setDeletedItemIds([]);
    }
  }, [sale, form]);

  const onSubmit = async (data: UpdateSaleData) => {
    setIsLoading(true);
    try {
      // Clean up empty strings to null and format dates
      const cleanedData: UpdateSaleData = {
        ...data,
        saleDate: data.saleDate
          ? new Date(data.saleDate).toISOString()
          : undefined,
        agreedMonthlyInstallmentAmount:
          data.agreedMonthlyInstallmentAmount != null &&
            String(data.agreedMonthlyInstallmentAmount).trim() !== ""
            ? String(data.agreedMonthlyInstallmentAmount)
            : undefined,
        notes: data.notes && data.notes.trim() !== "" ? data.notes : null,
      };

      // Update sale
      await dispatch(updateSale({ id: sale.id, data: cleanedData })).unwrap();

      // Delete removed items
      for (const itemId of deletedItemIds) {
        await deleteSaleItem(itemId);
      }

      // Update existing items and create new ones
      for (const item of items) {
        if ("isNew" in item && item.isNew) {
          // New item - create it
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { tempId: _tempId, isNew: _isNew, product, ...itemData } = item;
          await createSaleItem(sale.id, {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: (item.quantity * Number(item.unitPrice)).toFixed(2),
          });
        } else if ("id" in item) {
          // Existing item - update it
          // Note: productId cannot be changed for existing items via updateSaleItem
          // If product needs to change, delete and recreate the item
          const updateData: UpdateSaleItemData = {
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          };
          await updateSaleItem(item.id, updateData);
        }
      }

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
        isNew: true,
        productId: "",
        quantity: 1,
        unitPrice: "0",
        totalPrice: "0",
        product: {
          id: "",
          name: "",
          description: null,
          sku: null,
          barcode: null,
        },
      },
    ]);
  };

  const updateItemField = (
    itemIdOrTempId: string,
    field: "productId" | "quantity" | "unitPrice",
    value: string | number
  ) => {
    setItems(
      items.map((item) => {
        const id =
          "isNew" in item && item.isNew
            ? item.tempId
            : "id" in item
              ? item.id
              : "";
        if (id === itemIdOrTempId) {
          if (field === "productId") {
            const selectedProduct = products.find((p) => p.id === value);
            const updatedProduct = selectedProduct
              ? {
                id: selectedProduct.id,
                name: selectedProduct.name,
                description: selectedProduct.description,
                sku: selectedProduct.sku,
                barcode: selectedProduct.barcode,
              }
              : item.product;

            // For existing items, we can't change productId, but we update the product reference
            if ("isNew" in item && item.isNew) {
              return {
                ...item,
                productId: value as string,
                product: updatedProduct,
              };
            } else {
              // For existing items, we need to keep the structure but update product reference
              return {
                ...item,
                product: updatedProduct,
              };
            }
          }
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const removeItem = (itemIdOrTempId: string) => {
    const item = items.find(
      (i) =>
        ("isNew" in i && i.isNew ? i.tempId : "id" in i ? i.id : "") ===
        itemIdOrTempId
    );
    if (item && "id" in item) {
      // Existing item - mark for deletion
      setDeletedItemIds([...deletedItemIds, item.id]);
    }
    setItems(
      items.filter((i) => {
        const id = "isNew" in i && i.isNew ? i.tempId : "id" in i ? i.id : "";
        return id !== itemIdOrTempId;
      })
    );
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
          <DialogTitle>Edit Sale</DialogTitle>
          <DialogDescription>Update the sale details below.</DialogDescription>
        </DialogHeader>
        {(clientsError || productsError) && (
          <Alert variant="destructive" className="mx-6">
            <AlertDescription className="font-medium text-red-500">
              {clientsError || productsError}
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
                      instanceId="edit-sale-client-select"
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
                    <FormMessage />
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
                    { value: "DRAFT", label: "Draft" },
                    { value: "PENDING", label: "Pending" },
                    { value: "COMPLETED", label: "Completed" },
                    { value: "CANCELLED", label: "Cancelled" },
                  ];
                  return (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select<SelectOption>
                        instanceId="edit-sale-status-select"
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-6" />

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Sale Items</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage items in this sale
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
                    const itemId =
                      "isNew" in item && item.isNew
                        ? item.tempId
                        : "id" in item
                          ? item.id
                          : "";
                    return (
                      <div
                        key={itemId}
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
                            onClick={() => removeItem(itemId)}
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
                              instanceId={`edit-product-select-${itemId}`}
                              options={products.map((product) => ({
                                value: product.id,
                                label: product.name,
                              }))}
                              value={products.map((product) => ({
                                value: product.id,
                                label: product.name,
                              })).find((opt) => opt.value === (
                                "isNew" in item && item.isNew
                                  ? item.productId
                                  : "id" in item && item.product
                                    ? item.product.id
                                    : ""
                              )) || null}
                              onChange={(option) =>
                                updateItemField(itemId, "productId", option?.value || "")
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
                                updateItemField(
                                  itemId,
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
                                updateItemField(
                                  itemId,
                                  "unitPrice",
                                  e.target.value
                                )
                              }
                              disabled={isLoading}
                              className="h-9"
                            />
                          </div>
                        </div>
                        {("isNew" in item && item.isNew
                          ? item.product.name
                          : "id" in item
                            ? item.product.name
                            : "") && (
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
                    Updating...
                  </>
                ) : (
                  "Update Sale"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
