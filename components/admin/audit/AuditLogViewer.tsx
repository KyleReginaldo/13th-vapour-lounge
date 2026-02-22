"use client";

import { getAuditLogs } from "@/app/actions/audit-logs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Search,
} from "lucide-react";
import { useState } from "react";

export function AuditLogViewer() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs", page, actionFilter, entityTypeFilter],
    queryFn: async () => {
      const result = await getAuditLogs({
        page,
        pageSize: 50,
        action: actionFilter !== "all" ? actionFilter : undefined,
        entityType: entityTypeFilter !== "all" ? entityTypeFilter : undefined,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch audit logs");
      }

      return result.data;
    },
  });

  // Filter by search query on the frontend
  const filteredLogs = data?.logs?.filter((log: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.action?.toLowerCase().includes(search) ||
      log.entity_type?.toLowerCase().includes(search) ||
      log.entity_id?.toLowerCase().includes(search) ||
      log.user?.email?.toLowerCase().includes(search)
    );
  });

  const getActionBadgeColor = (action: string) => {
    if (action.includes("create")) return "default";
    if (action.includes("update") || action.includes("change"))
      return "secondary";
    if (action.includes("delete") || action.includes("reject"))
      return "destructive";
    if (action.includes("approve") || action.includes("verify"))
      return "default";
    return "outline";
  };

  const formatActionName = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Audit Logs
          </CardTitle>
          <CardDescription>
            Track all critical actions and changes in the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={actionFilter}
              onValueChange={(value) => setActionFilter(value)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="price_change">Price Changes</SelectItem>
                <SelectItem value="stock_adjustment">
                  Stock Adjustments
                </SelectItem>
                <SelectItem value="verify_payment">Payment Verify</SelectItem>
                <SelectItem value="approve_age_verification">
                  Age Verification
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={entityTypeFilter}
              onValueChange={(value) => setEntityTypeFilter(value)}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="product">Products</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="supplier">Suppliers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audit Logs Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Entity ID</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs && filteredLogs.length > 0 ? (
                  filteredLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(
                          new Date(log.created_at),
                          "MMM dd, yyyy HH:mm:ss"
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.user
                          ? `${log.user.first_name} ${log.user.last_name}`.trim() ||
                            log.user.email
                          : "System"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeColor(log.action)}>
                          {formatActionName(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">
                        {log.entity_type?.replace("_", " ")}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.entity_id?.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No audit logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {data.currentPage} of {data.totalPages} ({data.totalCount}{" "}
                total logs)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              {selectedLog &&
                format(
                  new Date(selectedLog.created_at),
                  "MMMM dd, yyyy 'at' HH:mm:ss"
                )}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Action
                  </div>
                  <div className="mt-1">
                    <Badge variant={getActionBadgeColor(selectedLog.action)}>
                      {formatActionName(selectedLog.action)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Entity Type
                  </div>
                  <div className="mt-1 capitalize">
                    {selectedLog.entity_type?.replace("_", " ")}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Entity ID
                  </div>
                  <div className="mt-1 font-mono text-sm">
                    {selectedLog.entity_id || "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    User
                  </div>
                  <div className="mt-1">
                    {selectedLog.user
                      ? `${selectedLog.user.first_name} ${selectedLog.user.last_name}`.trim() ||
                        selectedLog.user.email
                      : "System"}
                  </div>
                </div>
                {selectedLog.ip_address && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">
                      IP Address
                    </div>
                    <div className="mt-1 font-mono text-sm">
                      {selectedLog.ip_address}
                    </div>
                  </div>
                )}
              </div>

              {selectedLog.old_value && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Old Value
                  </div>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
                    {JSON.stringify(selectedLog.old_value, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_value && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    New Value
                  </div>
                  <pre className="bg-muted p-4 rounded-md text-xs overflow-auto">
                    {JSON.stringify(selectedLog.new_value, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
