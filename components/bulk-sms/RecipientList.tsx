"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export type RecipientOption = {
  id: string;
  name: string;
  subtitle?: string | null;
  phone: string | null;
  hasValidPhone: boolean;
};

interface RecipientListProps {
  title: string;
  options: RecipientOption[];
  selectedIds: Set<string>;
  onChange: (selectedIds: Set<string>) => void;
}

export function RecipientList({
  title,
  options,
  selectedIds,
  onChange,
}: RecipientListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const sendable = useMemo(
    () => options.filter((o) => o.hasValidPhone),
    [options]
  );

  const filtered = useMemo(() => {
    if (!searchTerm) return options;
    const search = searchTerm.toLowerCase();
    return options.filter(
      (o) =>
        o.name.toLowerCase().includes(search) ||
        o.subtitle?.toLowerCase().includes(search) ||
        o.phone?.toLowerCase().includes(search)
    );
  }, [options, searchTerm]);

  const allSelected =
    sendable.length > 0 && sendable.every((o) => selectedIds.has(o.id));

  const toggleAll = () => {
    onChange(allSelected ? new Set() : new Set(sendable.map((o) => o.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    onChange(next);
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Badge variant="secondary">
            {selectedIds.size} of {sendable.length} selected
          </Badge>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
          <Checkbox
            checked={allSelected}
            onCheckedChange={toggleAll}
            disabled={sendable.length === 0}
          />
          Select all {title.toLowerCase()}
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-96 overflow-y-auto border rounded-md divide-y">
          {filtered.length === 0 ? (
            <p className="p-4 text-sm text-center text-muted-foreground">
              No {title.toLowerCase()} found.
            </p>
          ) : (
            filtered.map((o) => (
              <label
                key={o.id}
                className={
                  o.hasValidPhone
                    ? "flex items-center gap-3 p-3 cursor-pointer hover:bg-accent"
                    : "flex items-center gap-3 p-3 opacity-60 cursor-not-allowed"
                }
              >
                <Checkbox
                  checked={selectedIds.has(o.id)}
                  onCheckedChange={() => toggleOne(o.id)}
                  disabled={!o.hasValidPhone}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{o.name}</p>
                  {o.subtitle && (
                    <p className="text-xs text-muted-foreground truncate">
                      {o.subtitle}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {o.hasValidPhone ? o.phone : "No valid phone"}
                </span>
              </label>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
