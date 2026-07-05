"use client";

import { useState } from "react";
import { useAppDispatch } from "@/lib/hooks";
import { renewClientSubscription } from "@/lib/slices/clientSubscriptionSlice";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import type { ClientSubscription } from "@/lib/types";
import { showSuccessAlert } from "@/lib/swal";
import moment from "moment";

interface RenewClientSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: ClientSubscription;
  onSuccess: () => void;
}

export function RenewClientSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
  onSuccess,
}: RenewClientSubscriptionDialogProps) {
  const dispatch = useAppDispatch();
  const [licenseExpiryDate, setLicenseExpiryDate] = useState(
    subscription.expiryDate.slice(0, 10)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRenew = async () => {
    if (!licenseExpiryDate) {
      setError("Enter the new license expiry date");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await dispatch(
        renewClientSubscription({
          id: subscription.id,
          data: { licenseExpiryDate },
        })
      ).unwrap();
      const alert = {
        title: "Subscription renewed",
        text: `${subscription.client.companyName} system and local expiry updated to ${moment(licenseExpiryDate).format("MMM D, YYYY")}.`,
      };
      onSuccess();
      await showSuccessAlert(alert);
    } catch (err: unknown) {
      setError(
        err && typeof err === "object" && "error" in err
          ? String((err as { error: string }).error)
          : "Update failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Update expiry</DialogTitle>
          <DialogDescription>
            Updates {subscription.client.companyName}&apos;s system and this
            record with a new expiry date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            Current expiry:{" "}
            <span className="font-medium text-foreground">
              {moment(subscription.expiryDate).format("MMM D, YYYY")}
            </span>
          </p>
          <div>
            <Label htmlFor="renew-expiry">New expiry date *</Label>
            <Input
              id="renew-expiry"
              type="date"
              className="mt-1 h-11"
              value={licenseExpiryDate}
              onChange={(e) => setLicenseExpiryDate(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription className="font-medium text-red-500">
                {error}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={() => void handleRenew()} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update expiry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
