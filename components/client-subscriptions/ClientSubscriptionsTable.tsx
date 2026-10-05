"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertTriangle, CalendarClock, Edit, KeyRound, MoreVertical, RotateCcw, ShieldCheck } from "lucide-react";
import { RenewClientSubscriptionDialog } from "./RenewClientSubscriptionDialog";
import { EditClientSubscriptionDialog } from "./EditClientSubscriptionDialog";
import { LicenceDialog, type LicenceAction } from "./LicenceDialog";
import type { ClientSubscription } from "@/lib/types";
import {
  expiryDateClassName,
  getExpiryUrgency,
  sortByExpiryDate,
} from "@/lib/utils/subscriptionExpiry";
import moment from "moment";

interface ClientSubscriptionsTableProps {
  subscriptions: ClientSubscription[];
  onRefresh: () => void;
}

export function ClientSubscriptionsTable({
  subscriptions,
  onRefresh,
}: ClientSubscriptionsTableProps) {
  const [renewOpen, setRenewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<ClientSubscription | null>(null);
  const [licenceAction, setLicenceAction] = useState<LicenceAction | null>(null);

  const openLicence = (sub: ClientSubscription, action: LicenceAction) => {
    setSelected(sub);
    setLicenceAction(action);
  };

  const sortedSubscriptions = useMemo(
    () => sortByExpiryDate(subscriptions),
    [subscriptions]
  );

  const openRenew = (sub: ClientSubscription) => {
    setSelected(sub);
    setRenewOpen(true);
  };

  const openEdit = (sub: ClientSubscription) => {
    setSelected(sub);
    setEditOpen(true);
  };

  if (sortedSubscriptions.length === 0) {
    return null;
  }

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Client</TableHead>
                <TableHead className="min-w-[120px]">Code</TableHead>
                <TableHead className="min-w-[200px]">M-Pesa base URL</TableHead>
                <TableHead className="min-w-[140px]">Expiry date</TableHead>
                <TableHead className="min-w-[170px]">Licence</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSubscriptions.map((sub) => {
                const urgency = getExpiryUrgency(sub.expiryDate);
                const canRenew = sub.status !== "cancelled";
                return (
                  <TableRow
                    key={sub.id}
                    className={
                      canRenew ? "cursor-pointer hover:bg-muted/40" : undefined
                    }
                    onClick={() => {
                      if (canRenew) openRenew(sub);
                    }}
                    title={
                      canRenew
                        ? "Click to update expiry"
                        : undefined
                    }
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {sub.client.companyName}
                        </span>
                        {sub.client.contactPerson && (
                          <span className="text-xs text-muted-foreground">
                            {sub.client.contactPerson}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{sub.code}</span>
                    </TableCell>
                    <TableCell>
                      {sub.mpesaBaseUrl ? (
                        <span className="font-mono text-sm break-all">
                          {sub.mpesaBaseUrl}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={expiryDateClassName(urgency)}
                        title={
                          urgency === "expired"
                            ? "Expired or due today"
                            : urgency === "warning"
                              ? "Expires within the next 10 days"
                              : undefined
                        }
                      >
                        {moment(sub.expiryDate).format("MMM D, YYYY")}
                      </span>
                      {sub.expiryAdjustedFrom && (
                        <span
                          className="block text-xs text-amber-700"
                          title="At its first check-in the hotel was already on this later date, so it was kept. Update the expiry to confirm or correct it."
                        >
                          from hotel (was {moment(sub.expiryAdjustedFrom).format("MMM D, YYYY")})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {sub.installationId ? (
                        <div className="flex flex-col text-xs">
                          <span
                            className="font-mono"
                            title={sub.installationId}
                          >
                            {sub.installationId.slice(0, 8)}…
                          </span>
                          <span className="text-muted-foreground">
                            {sub.lastCheckInAt
                              ? `checked in ${moment(sub.lastCheckInAt).fromNow()}`
                              : "offline code"}
                          </span>
                          {sub.conflictInstallationId && (
                            <span className="flex items-center gap-1 text-red-600">
                              <AlertTriangle className="h-3 w-3" /> used elsewhere
                            </span>
                          )}
                          {sub.reboundAt && (
                            <span
                              className="text-amber-700"
                              title={`Moved automatically from ${sub.previousInstallationId ?? "?"}`}
                            >
                              moved {moment(sub.reboundAt).fromNow()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not activated
                        </span>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">
                          {canRenew && (
                            <DropdownMenuItem onClick={() => openRenew(sub)}>
                              <CalendarClock className="mr-2 h-4 w-4" />
                              Update expiry
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => openEdit(sub)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openLicence(sub, "offline")}>
                            <ShieldCheck className="mr-2 h-4 w-4" />
                            Offline licence code
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openLicence(sub, "activation")}>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Activation key (new server)
                          </DropdownMenuItem>
                          {sub.installationId && (
                            <DropdownMenuItem onClick={() => openLicence(sub, "reset")}>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Reset installation
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {selected && editOpen && (
        <EditClientSubscriptionDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          subscription={selected}
          onSuccess={() => {
            setEditOpen(false);
            setSelected(null);
            onRefresh();
          }}
        />
      )}

      {selected && licenceAction && (
        <LicenceDialog
          open={licenceAction !== null}
          onOpenChange={(open) => {
            if (!open) {
              setLicenceAction(null);
              setSelected(null);
            }
          }}
          subscription={selected}
          action={licenceAction}
          onSuccess={onRefresh}
        />
      )}

      {selected && renewOpen && (
        <RenewClientSubscriptionDialog
          open={renewOpen}
          onOpenChange={setRenewOpen}
          subscription={selected}
          onSuccess={() => {
            setRenewOpen(false);
            setSelected(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
}
