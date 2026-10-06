"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  RecipientList,
  type RecipientOption,
} from "@/components/bulk-sms/RecipientList";
import { OtherRecipients } from "@/components/bulk-sms/OtherRecipients";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppSelector } from "@/lib/hooks";
import {
  smsService,
  type BroadcastResult,
  type OtherRecipient,
  type SmsRecipients,
} from "@/lib/services/smsService";
import { showSuccessAlert } from "@/lib/swal";
import { Loader2, Send } from "lucide-react";

const NAME_PLACEHOLDER = "{name}";

const TEMPLATES = [
  {
    label: "Christmas",
    message:
      "Dear {name}, Merry Christmas from all of us at Esperanza Digital Solutions! Thank you for your continued support. Wishing you joy and peace this festive season.",
  },
  {
    label: "New Year",
    message:
      "Dear {name}, Happy New Year from Esperanza Digital Solutions! Thank you for a great year together. We wish you success and prosperity in the year ahead.",
  },
  {
    label: "Season's Greetings",
    message:
      "Dear {name}, Season's greetings from Esperanza Digital Solutions! Merry Christmas and a prosperous New Year.",
  },
];

/** Standard SMS: 160 chars for one part, 153 per part when split. */
function smsParts(length: number): number {
  if (length === 0) return 0;
  return length <= 160 ? 1 : Math.ceil(length / 153);
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: { error?: string } } }).response
      ?.data;
    if (data?.error) return data.error;
  }
  return fallback;
}

export default function BulkSmsPage() {
  const { employee } = useAppSelector((state) => state.auth);
  const isDirector = employee?.role?.name === "DIRECTOR";

  const [recipients, setRecipients] = useState<SmsRecipients>({
    clients: [],
    employees: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(
    new Set()
  );
  const [otherRecipients, setOtherRecipients] = useState<OtherRecipient[]>(
    []
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [lastResult, setLastResult] = useState<BroadcastResult | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setRecipients(await smsService.getRecipients());
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load recipients"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDirector) {
      void load();
    }
  }, [isDirector, load]);

  const clientOptions: RecipientOption[] = useMemo(
    () =>
      recipients.clients.map((c) => ({
        id: c.id,
        name: c.companyName,
        subtitle: c.contactPerson,
        phone: c.phone || c.alternatePhone,
        hasValidPhone: c.hasValidPhone,
      })),
    [recipients.clients]
  );

  const employeeOptions: RecipientOption[] = useMemo(
    () =>
      recipients.employees.map((e) => ({
        id: e.id,
        name: `${e.firstName} ${e.lastName}`,
        subtitle: e.position || e.roleName,
        phone: e.phone,
        hasValidPhone: e.hasValidPhone,
      })),
    [recipients.employees]
  );

  if (!isDirector) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center border rounded-lg bg-card">
          <p className="text-muted-foreground">
            Only directors can send bulk SMS.
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const totalSelected =
    selectedClientIds.size + selectedEmployeeIds.size + otherRecipients.length;
  const trimmedMessage = message.trim();
  const preview = trimmedMessage
    .split(NAME_PLACEHOLDER)
    .join(clientOptions[0]?.subtitle || "John");
  const parts = smsParts(preview.length);
  const canSend = trimmedMessage.length > 0 && totalSelected > 0 && !isSending;

  const handleSend = async () => {
    setIsSending(true);
    setError(null);
    try {
      const result = await smsService.broadcast({
        message: trimmedMessage,
        clientIds: [...selectedClientIds],
        employeeIds: [...selectedEmployeeIds],
        otherRecipients,
      });
      setConfirmOpen(false);
      setLastResult(result);
      if (result.failed.length === 0 && result.skipped.length === 0) {
        setMessage("");
        setSelectedClientIds(new Set());
        setSelectedEmployeeIds(new Set());
        setOtherRecipients([]);
      }
      await showSuccessAlert({
        title: "Bulk SMS sent",
        text: `${result.sent} message(s) sent successfully.`,
      });
    } catch (err) {
      setConfirmOpen(false);
      setError(getErrorMessage(err, "Failed to send bulk SMS"));
    } finally {
      setIsSending(false);
    }
  };

  const problems = lastResult
    ? [...lastResult.failed, ...lastResult.skipped]
    : [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Bulk SMS</h1>
          <p className="text-muted-foreground">
            Send greetings such as Christmas or New Year messages to clients
            and employees.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="font-medium text-red-500">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {lastResult && problems.length > 0 && (
          <Alert>
            <AlertDescription>
              <p className="font-medium mb-2">
                {lastResult.sent} sent, {lastResult.failed.length} failed,{" "}
                {lastResult.skipped.length} skipped:
              </p>
              <ul className="text-sm list-disc pl-5 space-y-1 max-h-48 overflow-y-auto">
                {problems.map((p) => (
                  <li key={`${p.type}-${p.id}`}>
                    {p.name}
                    {p.mobile ? ` (${p.mobile})` : ""} — {p.reason}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((t) => (
                <Button
                  key={t.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMessage(t.message)}
                >
                  {t.label}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setMessage((m) => m + NAME_PLACEHOLDER)}
              >
                Insert {NAME_PLACEHOLDER}
              </Button>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-sms-message">Text</Label>
              <Textarea
                id="bulk-sms-message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message. Use {name} to include each recipient's name."
              />
              <p className="text-xs text-muted-foreground">
                {preview.length} characters · {parts} SMS part
                {parts === 1 ? "" : "s"} per recipient
                {message.includes(NAME_PLACEHOLDER) &&
                  " (varies with name length)"}
                . {NAME_PLACEHOLDER} becomes the client&apos;s contact person
                (or company name) and the employee&apos;s first name.
              </p>
            </div>
            {trimmedMessage && (
              <div className="rounded-md border bg-muted/50 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Preview
                </p>
                <p className="text-sm whitespace-pre-wrap">{preview}</p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {selectedClientIds.size} client(s), {selectedEmployeeIds.size}{" "}
                employee(s) and {otherRecipients.length} other recipient(s)
                selected
              </p>
              <Button
                onClick={() => setConfirmOpen(true)}
                disabled={!canSend}
                className="w-full sm:w-auto"
              >
                <Send className="mr-2 h-4 w-4" />
                Send to {totalSelected} recipient{totalSelected === 1 ? "" : "s"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <RecipientList
              title="Clients"
              options={clientOptions}
              selectedIds={selectedClientIds}
              onChange={setSelectedClientIds}
            />
            <RecipientList
              title="Employees"
              options={employeeOptions}
              selectedIds={selectedEmployeeIds}
              onChange={setSelectedEmployeeIds}
            />
          </div>
        )}

        <OtherRecipients
          recipients={otherRecipients}
          onChange={setOtherRecipients}
        />

        <Dialog
          open={confirmOpen}
          onOpenChange={(open) => !isSending && setConfirmOpen(open)}
        >
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Send Bulk SMS</DialogTitle>
              <DialogDescription>
                This will send the message below to {selectedClientIds.size}{" "}
                client(s), {selectedEmployeeIds.size} employee(s) and{" "}
                {otherRecipients.length} other recipient(s) via
                Advanta. SMS cannot be recalled once sent.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-md border bg-muted/50 p-3">
              <p className="text-sm whitespace-pre-wrap">{preview}</p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button onClick={handleSend} disabled={isSending}>
                {isSending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
