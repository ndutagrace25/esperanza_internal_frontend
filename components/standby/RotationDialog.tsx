"use client";

import { useEffect, useState } from "react";
import Select from "react-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowDown, ArrowUp, Loader2, X } from "lucide-react";
import {
  fullName,
  standbyService,
  type StandbyRota,
} from "@/lib/services/standbyService";

interface SelectOption {
  value: string;
  label: string;
}

interface RotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rota: StandbyRota;
  onSuccess: (rota: StandbyRota) => void;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: { error?: string } } }).response
      ?.data;
    if (data?.error) return data.error;
  }
  return fallback;
}

export function RotationDialog({
  open,
  onOpenChange,
  rota,
  onSuccess,
}: RotationDialogProps) {
  const [order, setOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setOrder(rota.rotation.map((m) => m.employeeId));
  }, [open, rota]);

  const nameOf = (id: string) => {
    const e = rota.activeEmployees.find((x) => x.id === id);
    return e ? fullName(e) : "Unknown";
  };

  const move = (index: number, delta: number) => {
    const next = [...order];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item!);
    setOrder(next);
  };

  const addOptions: SelectOption[] = rota.activeEmployees
    .filter((e) => !order.includes(e.id))
    .map((e) => ({
      value: e.id,
      label: `${fullName(e)}${e.position ? ` — ${e.position.trim()}` : ""}`,
    }));

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    try {
      onSuccess(await standbyService.setRotation(order));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save rotation"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isLoading && onOpenChange(o)}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle>Edit Rotation</DialogTitle>
          <DialogDescription>
            People take weekend standby in this order, then start again from
            #1. Upcoming weekends that were not changed by hand are rebuilt
            from the new order; this weekend stays as it is.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="font-medium text-red-500">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="border rounded-md divide-y">
          {order.length === 0 ? (
            <p className="p-4 text-sm text-center text-muted-foreground">
              Add people to the rotation below.
            </p>
          ) : (
            order.map((id, index) => (
              <div key={id} className="flex items-center gap-2 p-2">
                <span className="w-8 text-center font-mono text-sm text-muted-foreground">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm font-medium">{nameOf(id)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => move(index, -1)}
                  disabled={index === 0 || isLoading}
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => move(index, 1)}
                  disabled={index === order.length - 1 || isLoading}
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setOrder(order.filter((x) => x !== id))}
                  disabled={isLoading}
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <Select<SelectOption>
          instanceId="standby-rotation-add"
          options={addOptions}
          value={null}
          onChange={(option) => option && setOrder([...order, option.value])}
          placeholder="Add a person to the rotation..."
          isDisabled={isLoading}
          isSearchable
          styles={{
            control: (base) => ({ ...base, minHeight: "44px" }),
            menu: (base) => ({ ...base, zIndex: 9999 }),
          }}
        />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || order.length === 0}
            className="w-full sm:w-auto"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Rotation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
