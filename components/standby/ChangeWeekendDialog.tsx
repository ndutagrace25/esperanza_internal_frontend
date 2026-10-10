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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import {
  formatWeekend,
  fullName,
  standbyService,
  type StandbyNotification,
  type StandbyRota,
  type StandbyWeekend,
} from "@/lib/services/standbyService";

interface SelectOption {
  value: string;
  label: string;
}

export type ChangeMode = "change" | "swap";

interface ChangeWeekendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: ChangeMode;
  weekend: StandbyWeekend | null;
  rota: StandbyRota;
  onSuccess: (notification: StandbyNotification) => void;
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: { error?: string } } }).response
      ?.data;
    if (data?.error) return data.error;
  }
  return fallback;
}

export function ChangeWeekendDialog({
  open,
  onOpenChange,
  mode,
  weekend,
  rota,
  onSuccess,
}: ChangeWeekendDialogProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelected(null);
    setReason("");
    setError(null);
  }, [open, weekend, mode]);

  if (!weekend) return null;

  const options: SelectOption[] =
    mode === "change"
      ? rota.activeEmployees
          .filter((e) => e.id !== weekend.employeeId)
          .map((e) => ({ value: e.id, label: fullName(e) }))
      : rota.weekends
          .filter(
            (w) =>
              w.id !== weekend.id &&
              w.weekendStart >= rota.currentWeekendStart &&
              w.employeeId !== weekend.employeeId
          )
          .map((w) => ({
            value: w.id,
            label: `${formatWeekend(w.weekendStart)} — ${fullName(w.employee)}`,
          }));

  const handleSave = async () => {
    if (!selected) {
      setError(mode === "change" ? "Choose a person" : "Choose a weekend");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result =
        mode === "change"
          ? await standbyService.changeWeekend(weekend.id, selected, reason)
          : await standbyService.swapWeekends(weekend.id, selected, reason);
      onSuccess(result.notification);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save the change"));
    } finally {
      setIsLoading(false);
    }
  };

  const who = fullName(weekend.employee);
  const when = formatWeekend(weekend.weekendStart);

  return (
    <Dialog open={open} onOpenChange={(o) => !isLoading && onOpenChange(o)}>
      <DialogContent className="max-w-lg bg-white">
        <DialogHeader>
          <DialogTitle>
            {mode === "change" ? "Change Standby Person" : "Swap Weekends"}
          </DialogTitle>
          <DialogDescription>
            {mode === "change"
              ? `${who} is on standby ${when}. Choose who covers instead.`
              : `${who} is on standby ${when}. Choose a weekend to swap with; the two people exchange weekends.`}{" "}
            All employees get an SMS about the change.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="font-medium text-red-500">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>{mode === "change" ? "Covering person *" : "Swap with *"}</Label>
          <Select<SelectOption>
            instanceId={`standby-${mode}-select`}
            options={options}
            value={options.find((o) => o.value === selected) ?? null}
            onChange={(option) => setSelected(option?.value ?? null)}
            placeholder={
              mode === "change" ? "Select a person..." : "Select a weekend..."
            }
            isDisabled={isLoading}
            isSearchable
            styles={{
              control: (base) => ({ ...base, minHeight: "44px" }),
              menu: (base) => ({ ...base, zIndex: 9999 }),
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="standby-change-reason">Reason</Label>
          <Textarea
            id="standby-change-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Excused — family event"
            disabled={isLoading}
          />
        </div>

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
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save and Notify
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
