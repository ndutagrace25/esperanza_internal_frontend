"use client";

import { useState, useEffect } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { updateIntegration } from "@/lib/slices/clientIntegrationSlice";
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
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { ClientIntegration } from "@/lib/types";

interface EditClientIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integration: ClientIntegration;
  onSuccess: () => void;
}

export function EditClientIntegrationDialog({
  open,
  onOpenChange,
  integration,
  onSuccess,
}: EditClientIntegrationDialogProps) {
  const dispatch = useAppDispatch();
  const [label, setLabel] = useState(integration.label);
  const [value, setValue] = useState(integration.value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLabel(integration.label);
      setValue(integration.value);
      setError(null);
    }
  }, [open, integration.label, integration.value]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedLabel = label.trim();
    const trimmedValue = value.trim();
    if (!trimmedLabel) {
      setError("Label is required");
      return;
    }
    if (!trimmedValue) {
      setError("Value is required");
      return;
    }
    setIsLoading(true);
    try {
      await dispatch(
        updateIntegration(integration.id, {
          label: trimmedLabel,
          value: trimmedValue,
        })
      ).unwrap();
      onSuccess();
    } catch (err) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to update integration"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle>Edit integration</DialogTitle>
          <DialogDescription>
            Update the label or value for this integration detail.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-label">Label *</Label>
            <Input
              id="edit-label"
              placeholder="e.g. mpesa_web_portal_username"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="edit-value">Value *</Label>
            <Input
              id="edit-value"
              placeholder="Enter value"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
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
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
