"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RenewClientSubscriptionDialog } from "./RenewClientSubscriptionDialog";
import type { ClientSubscription } from "@/lib/types";
import {
  expiryDateClassName,
  getExpiryUrgency,
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
  const [selected, setSelected] = useState<ClientSubscription | null>(null);

  const openRenew = (sub: ClientSubscription) => {
    setSelected(sub);
    setRenewOpen(true);
  };

  if (subscriptions.length === 0) {
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
                <TableHead className="min-w-[140px]">Expiry date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => {
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
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {selected && (
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
