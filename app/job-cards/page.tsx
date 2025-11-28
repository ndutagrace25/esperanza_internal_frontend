"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { JobCardsTable } from "@/components/job-cards/JobCardsTable";
import { CreateJobCardDialog } from "@/components/job-cards/CreateJobCardDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchJobCards, clearJobCardError } from "@/lib/slices/jobCardSlice";
import { Plus, Search, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function JobCardsPage() {
  const dispatch = useAppDispatch();
  const { jobCards, pagination, isLoading, error } = useAppSelector(
    (state) => state.jobCard
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchJobCards({ page: currentPage, limit: 10 }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    return () => {
      dispatch(clearJobCardError());
    };
  }, [dispatch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const filteredJobCards = jobCards.filter((jobCard) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      jobCard.jobNumber.toLowerCase().includes(search) ||
      jobCard.client.companyName.toLowerCase().includes(search) ||
      jobCard.client.contactPerson?.toLowerCase().includes(search) ||
      jobCard.purpose?.toLowerCase().includes(search) ||
      jobCard.location?.toLowerCase().includes(search) ||
      jobCard.supportStaff?.firstName.toLowerCase().includes(search) ||
      jobCard.supportStaff?.lastName.toLowerCase().includes(search)
    );
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Job Cards</h1>
            <p className="text-muted-foreground">
              Manage job cards, visits, and client service records.
            </p>
          </div>
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Job Card
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="font-medium text-red-500">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by job number, client, purpose, location, staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </form>

        {/* Job Cards Table */}
        {isLoading && jobCards.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredJobCards.length === 0 ? (
          <div className="p-12 text-center border rounded-lg bg-card">
            <p className="text-muted-foreground">
              {searchTerm
                ? "No job cards found matching your search."
                : "No job cards found. Create your first job card to get started."}
            </p>
          </div>
        ) : (
          <JobCardsTable
            jobCards={filteredJobCards}
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            isLoading={isLoading}
          />
        )}

        {/* Create Job Card Dialog */}
        <CreateJobCardDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onSuccess={() => {
            setIsCreateDialogOpen(false);
            dispatch(fetchJobCards({ page: currentPage, limit: 10 }));
          }}
        />
      </div>
    </DashboardLayout>
  );
}
