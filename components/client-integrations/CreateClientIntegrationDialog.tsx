"use client";

import { useState } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { createIntegration } from "@/lib/slices/clientIntegrationSlice";
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

interface CreateClientIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onSuccess: () => void;
}

export function CreateClientIntegrationDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  onSuccess,
}: CreateClientIntegrationDialogProps) {
  const dispatch = useAppDispatch();
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        createIntegration({
          clientId,
          label: trimmedLabel,
          value: trimmedValue,
        })
      ).unwrap();
      setLabel("");
      setValue("");
      onSuccess();
    } catch (err) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Failed to create integration"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-md">
        <DialogHeader>
          <DialogTitle>Add integration</DialogTitle>
          <DialogDescription>
            Add a label/value pair for {clientName}. E.g. label:
            mpesa_web_portal_username, value: the username.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="create-label">Label *</Label>
            <Input
              id="create-label"
              placeholder="e.g. mpesa_web_portal_username"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={isLoading}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="create-value">Value *</Label>
            <Input
              id="create-value"
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
                  Adding...
                </>
              ) : (
                "Add"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
