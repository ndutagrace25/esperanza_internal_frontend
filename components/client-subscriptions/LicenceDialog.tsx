"use client";

import { useState } from "react";
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
import { Check, Copy, Loader2 } from "lucide-react";
import type { ClientSubscription } from "@/lib/types";
import { clientSubscriptionService } from "@/lib/services/clientSubscriptionService";
import moment from "moment";

export type LicenceAction = "offline" | "activation" | "reset";

const titles: Record<LicenceAction, { title: string; description: string }> = {
  offline: {
    title: "Offline licence code",
    description:
      "For a server that can't reach us. Enter the installation ID from the client's Licence page, then send them the code to paste there.",
  },
  activation: {
    title: "Activation key",
    description:
      "Moving to a new server: the client enters this one-time key on the new server's Licence page and it takes over the licence.",
  },
  reset: {
    title: "Reset installation",
    description:
      "Unbinds the licence. The next server that checks in with this company code takes it over. Use when a server was rebuilt and lost its installation.",
  },
};

const errorMessage = (error: unknown) =>
  (error as { response?: { data?: { error?: string } } })?.response?.data?.error ||
  (error instanceof Error ? error.message : "Something went wrong");

export function LicenceDialog({
  open,
  onOpenChange,
  subscription,
  action,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: ClientSubscription;
  action: LicenceAction;
  onSuccess: () => void;
}) {
  const [installationId, setInstallationId] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const run = async () => {
    setError(null);
    setIsLoading(true);
    try {
      if (action === "offline") {
        const { license } = await clientSubscriptionService.issueOfflineLicence(
          subscription.id,
          installationId.trim()
        );
        setResult(license);
      } else if (action === "activation") {
        const { activationKey } = await clientSubscriptionService.createLicenceActivationKey(
          subscription.id
        );
        setResult(activationKey);
      } else {
        await clientSubscriptionService.resetLicenceInstallation(subscription.id);
        onSuccess();
        return;
      }
      onSuccess();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const copy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-white">
        <DialogHeader>
          <DialogTitle>{titles[action].title}</DialogTitle>
          <DialogDescription>
            {subscription.client.companyName} · {subscription.code}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{titles[action].description}</p>

          <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
            <div>
              <span className="text-muted-foreground">Bound installation: </span>
              <span className="font-mono">{subscription.installationId || "none yet"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last check-in: </span>
              {subscription.lastCheckInAt
                ? `${moment(subscription.lastCheckInAt).fromNow()} (v${subscription.lastCheckInVersion || "?"})`
                : "never"}
            </div>
            {subscription.reboundAt && (
              <div className="text-amber-700">
                Moved automatically {moment(subscription.reboundAt).fromNow()} from{" "}
                <span className="font-mono">{subscription.previousInstallationId}</span> (it had
                stopped checking in)
              </div>
            )}
            {subscription.conflictInstallationId && (
              <div className="text-red-600">
                Another installation tried to use this licence{" "}
                {subscription.conflictAt ? moment(subscription.conflictAt).fromNow() : ""}:{" "}
                <span className="font-mono">{subscription.conflictInstallationId}</span>
              </div>
            )}
          </div>

          {action === "offline" && !result && (
            <div className="space-y-2">
              <Label htmlFor="installation-id">Installation ID</Label>
              <Input
                id="installation-id"
                value={installationId}
                onChange={(e) => setInstallationId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="font-mono"
              />
            </div>
          )}

          {result && (
            <div className="space-y-2">
              <Label>{action === "offline" ? "Licence code" : "Activation key"}</Label>
              <div className="flex gap-2 items-start">
                <code className="flex-1 rounded-md border bg-muted/40 p-2 text-xs font-mono break-all select-all max-h-40 overflow-y-auto">
                  {result}
                </code>
                <Button type="button" variant="outline" size="sm" onClick={copy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {result ? "Close" : "Cancel"}
          </Button>
          {!result && (
            <Button
              onClick={run}
              disabled={isLoading || (action === "offline" && !installationId.trim())}
              variant={action === "reset" ? "destructive" : "default"}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {action === "offline"
                ? "Generate code"
                : action === "activation"
                  ? "Create key"
                  : "Reset installation"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
