"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OtherRecipient } from "@/lib/services/smsService";
import { Plus, X } from "lucide-react";

/**
 * Normalizes a Kenyan mobile to 2547XXXXXXXX / 2541XXXXXXXX, or null if invalid.
 * Mirrors the backend check so mistakes are caught before sending.
 */
export function toValidKenyanMobile(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  let mobile: string | null = null;
  if (digits.length === 9) mobile = `254${digits}`;
  else if (digits.length === 10 && digits.startsWith("0"))
    mobile = `254${digits.slice(1)}`;
  else if (digits.length === 12 && digits.startsWith("254")) mobile = digits;
  return mobile && /^254[17]\d{8}$/.test(mobile) ? mobile : null;
}

interface OtherRecipientsProps {
  recipients: OtherRecipient[];
  onChange: (recipients: OtherRecipient[]) => void;
}

export function OtherRecipients({ recipients, onChange }: OtherRecipientsProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter a name");
      return;
    }
    const mobile = toValidKenyanMobile(phone);
    if (!mobile) {
      setError("Enter a valid Kenyan mobile number, e.g. 0722 123 456");
      return;
    }
    if (recipients.some((r) => toValidKenyanMobile(r.phone) === mobile)) {
      setError("This number has already been added");
      return;
    }
    onChange([...recipients, { name: trimmedName, phone: mobile }]);
    setName("");
    setPhone("");
    setError(null);
  };

  const handleRemove = (index: number) => {
    onChange(recipients.filter((_, i) => i !== index));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">Other Recipients</CardTitle>
          <Badge variant="secondary">{recipients.length} added</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Add people who are not in the clients or employees lists.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            handleAdd();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="other-recipient-name">Name</Label>
            <Input
              id="other-recipient-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name used for {name}"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="other-recipient-phone">Phone</Label>
            <Input
              id="other-recipient-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0722 123 456"
            />
          </div>
          <Button type="submit" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </form>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {recipients.length > 0 && (
          <div className="border rounded-md divide-y">
            {recipients.map((r, index) => (
              <div key={r.phone} className="flex items-center gap-3 p-3">
                <p className="text-sm font-medium flex-1 truncate">{r.name}</p>
                <span className="text-xs text-muted-foreground">{r.phone}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleRemove(index)}
                  aria-label={`Remove ${r.name}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
