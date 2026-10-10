"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  ChangeWeekendDialog,
  type ChangeMode,
} from "@/components/standby/ChangeWeekendDialog";
import { RotationDialog } from "@/components/standby/RotationDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppSelector } from "@/lib/hooks";
import {
  formatWeekend,
  fullName,
  standbyService,
  type StandbyNotification,
  type StandbyRota,
  type StandbyWeekend,
} from "@/lib/services/standbyService";
import { showSuccessAlert } from "@/lib/swal";
import {
  ArrowLeftRight,
  Loader2,
  MoreVertical,
  Pencil,
  Send,
  ShieldCheck,
  UserRoundCog,
} from "lucide-react";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const data = (err as { response?: { data?: { error?: string } } }).response
      ?.data;
    if (data?.error) return data.error;
  }
  return fallback;
}

function notificationText(n: StandbyNotification): string {
  return n.errors.length === 0
    ? `${n.sent} SMS sent to employees.`
    : `${n.sent} SMS sent. Not sent: ${n.errors.join("; ")}`;
}

export default function StandbyPage() {
  const { employee } = useAppSelector((state) => state.auth);
  const isDirector = employee?.role?.name === "DIRECTOR";

  const [rota, setRota] = useState<StandbyRota | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rotationOpen, setRotationOpen] = useState(false);
  const [changeTarget, setChangeTarget] = useState<{
    weekend: StandbyWeekend;
    mode: ChangeMode;
  } | null>(null);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setRota(await standbyService.getRota());
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load the standby rota"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSendReminder = async () => {
    setIsSendingReminder(true);
    setError(null);
    try {
      const result = await standbyService.sendReminder();
      setReminderOpen(false);
      void load();
      if (result.skipped) {
        setError(result.skipped);
        return;
      }
      await showSuccessAlert({
        title: "Standby reminder sent",
        text: notificationText(result),
      });
    } catch (err) {
      setReminderOpen(false);
      setError(getErrorMessage(err, "Failed to send the reminder"));
    } finally {
      setIsSendingReminder(false);
    }
  };

  if (isLoading && !rota) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const current = rota?.weekends.find(
    (w) => w.weekendStart === rota.currentWeekendStart
  );
  const upcoming =
    rota?.weekends.filter((w) => w.weekendStart > rota.currentWeekendStart) ??
    [];
  const past =
    rota?.weekends
      .filter((w) => w.weekendStart < rota.currentWeekendStart)
      .reverse() ?? [];
  const hasRotation = (rota?.rotation.length ?? 0) > 0;

  const actionsFor = (w: StandbyWeekend) =>
    isDirector && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-white">
          <DropdownMenuItem
            onClick={() => setChangeTarget({ weekend: w, mode: "change" })}
          >
            <UserRoundCog className="mr-2 h-4 w-4" />
            Change person
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setChangeTarget({ weekend: w, mode: "swap" })}
          >
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            Swap with another weekend
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

  const changeNote = (w: StandbyWeekend) =>
    w.originalEmployee && (
      <span className="text-xs text-amber-700">
        Covering for {fullName(w.originalEmployee)}
        {w.changeReason ? ` — ${w.changeReason}` : ""}
      </span>
    );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Weekend Standby</h1>
            <p className="text-muted-foreground">
              Who is on standby each weekend. All employees get an SMS every
              Saturday at 9:00 AM.
            </p>
          </div>
          {isDirector && hasRotation && (
            <Button
              variant="outline"
              onClick={() => setReminderOpen(true)}
              className="w-full sm:w-auto"
            >
              <Send className="mr-2 h-4 w-4" />
              Send Reminder Now
            </Button>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription className="font-medium text-red-500">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {rota && !hasRotation ? (
          <div className="p-12 text-center border rounded-lg bg-card space-y-4">
            <p className="text-muted-foreground">
              The standby rotation has not been set up yet.
            </p>
            {isDirector && (
              <Button onClick={() => setRotationOpen(true)}>
                Set Up Rotation
              </Button>
            )}
          </div>
        ) : (
          rota && (
            <>
              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2 border-primary/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      This weekend ·{" "}
                      {formatWeekend(rota.currentWeekendStart)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex items-start justify-between gap-4">
                    {current ? (
                      <div className="flex flex-col gap-1">
                        <p className="text-3xl font-bold">
                          {fullName(current.employee)}
                        </p>
                        {changeNote(current)}
                        <p className="text-xs text-muted-foreground">
                          {current.reminderSentAt
                            ? `Reminder sent ${new Date(
                                current.reminderSentAt
                              ).toLocaleString("en-GB", {
                                weekday: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`
                            : "Reminder not sent yet"}
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Not scheduled</p>
                    )}
                    {current && actionsFor(current)}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Rotation order
                    </CardTitle>
                    {isDirector && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRotationOpen(true)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-1">
                      {rota.rotation.map((m, i) => (
                        <li key={m.employeeId} className="flex gap-3 text-sm">
                          <span className="w-5 font-mono text-muted-foreground">
                            {i + 1}
                          </span>
                          {fullName(m.employee)}
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Upcoming weekends</h2>
                <div className="border rounded-lg overflow-hidden bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Weekend</TableHead>
                        <TableHead>On standby</TableHead>
                        {isDirector && (
                          <TableHead className="w-[50px]">Actions</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcoming.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell className="whitespace-nowrap">
                            {formatWeekend(w.weekendStart)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {fullName(w.employee)}
                                {w.originalEmployee && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2 text-amber-700 border-amber-300"
                                  >
                                    Changed
                                  </Badge>
                                )}
                              </span>
                              {changeNote(w)}
                            </div>
                          </TableCell>
                          {isDirector && <TableCell>{actionsFor(w)}</TableCell>}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {past.length > 0 && (
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">Past weekends</h2>
                  <div className="border rounded-lg overflow-hidden bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Weekend</TableHead>
                          <TableHead>Was on standby</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {past.map((w) => (
                          <TableRow key={w.id}>
                            <TableCell className="whitespace-nowrap text-muted-foreground">
                              {formatWeekend(w.weekendStart)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span>{fullName(w.employee)}</span>
                                {changeNote(w)}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </>
          )
        )}

        {rota && isDirector && (
          <>
            <RotationDialog
              open={rotationOpen}
              onOpenChange={setRotationOpen}
              rota={rota}
              onSuccess={(updated) => {
                setRotationOpen(false);
                setRota(updated);
              }}
            />
            <ChangeWeekendDialog
              open={!!changeTarget}
              onOpenChange={(open) => !open && setChangeTarget(null)}
              mode={changeTarget?.mode ?? "change"}
              weekend={changeTarget?.weekend ?? null}
              rota={rota}
              onSuccess={(notification) => {
                setChangeTarget(null);
                void load();
                void showSuccessAlert({
                  title: "Standby updated",
                  text: notificationText(notification),
                });
              }}
            />
          </>
        )}

        <Dialog
          open={reminderOpen}
          onOpenChange={(open) => !isSendingReminder && setReminderOpen(open)}
        >
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Send Standby Reminder</DialogTitle>
              <DialogDescription>
                SMS all employees that{" "}
                {current ? fullName(current.employee) : "the standby person"} is
                on standby {rota && formatWeekend(rota.currentWeekendStart)}.
                {current?.reminderSentAt &&
                  " A reminder was already sent for this weekend; this sends it again."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReminderOpen(false)}
                disabled={isSendingReminder}
              >
                Cancel
              </Button>
              <Button onClick={handleSendReminder} disabled={isSendingReminder}>
                {isSendingReminder && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
