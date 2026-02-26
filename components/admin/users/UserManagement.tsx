"use client";

import {
  deactivateUser,
  deleteUser,
  forceLogoutUser,
  getAllUsers,
  getRoles,
  reactivateUser,
  updateUserRole,
} from "@/app/actions/user-management";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Filter,
  LogOut,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

type UserFilter = {
  role?: string;
  isVerified?: boolean;
  isActive?: boolean;
};

export function UserManagement() {
  const [filters, setFilters] = useState<UserFilter>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [actionDialog, setActionDialog] = useState<
    "logout" | "deactivate" | "reactivate" | "delete" | "changeRole" | null
  >(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [reason, setReason] = useState("");
  const [newRoleId, setNewRoleId] = useState("");

  const queryClient = useQueryClient();

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ["users", filters],
    queryFn: async () => {
      const result = await getAllUsers(filters);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch users");
      }
      return result.data;
    },
  });

  // Fetch roles for role change dropdown
  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const result = await getRoles();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch roles");
      }
      return result.data;
    },
  });

  // Mutations
  const forceLogoutMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      forceLogoutUser(userId, reason),
    onSuccess: () => {
      toast.success("User logged out successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to logout user");
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      deactivateUser(userId, reason),
    onSuccess: () => {
      toast.success("User deactivated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to deactivate user");
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (userId: string) => reactivateUser(userId),
    onSuccess: () => {
      toast.success("User reactivated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reactivate user");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({
      userId,
      confirmation,
    }: {
      userId: string;
      confirmation: string;
    }) => deleteUser(userId, confirmation),
    onSuccess: () => {
      toast.success("User deleted permanently");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      updateUserRole(userId, roleId),
    onSuccess: () => {
      toast.success("User role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update role");
    },
  });

  const closeDialog = () => {
    setActionDialog(null);
    setSelectedUser(null);
    setReason("");
    setDeleteConfirmation("");
    setNewRoleId("");
  };

  const handleAction = () => {
    if (!selectedUser) return;

    switch (actionDialog) {
      case "logout":
        forceLogoutMutation.mutate({ userId: selectedUser.id, reason });
        break;
      case "deactivate":
        deactivateMutation.mutate({ userId: selectedUser.id, reason });
        break;
      case "reactivate":
        reactivateMutation.mutate(selectedUser.id);
        break;
      case "delete":
        deleteMutation.mutate({
          userId: selectedUser.id,
          confirmation: deleteConfirmation,
        });
        break;
      case "changeRole":
        if (newRoleId) {
          updateRoleMutation.mutate({
            userId: selectedUser.id,
            roleId: newRoleId,
          });
        }
        break;
    }
  };

  // Filter users by search query
  const filteredUsers = users?.filter((user: any) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(search) ||
      user.full_name?.toLowerCase().includes(search) ||
      user.first_name?.toLowerCase().includes(search) ||
      user.last_name?.toLowerCase().includes(search)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage user accounts, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.isActive?.toString() || "all"}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  isActive: value === "all" ? undefined : value === "true",
                })
              }
            >
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.role || "all"}
              onValueChange={(value) =>
                setFilters({
                  ...filters,
                  role: value === "all" ? undefined : value,
                })
              }
            >
              <SelectTrigger className="w-full sm:w-44">
                <Shield className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user: any) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name ||
                          `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                          "No Name"}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {user.roles?.name || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.is_verified ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionDialog("logout");
                            }}
                          >
                            <LogOut className="h-3 w-3" />
                          </Button>
                          {user.is_active ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setActionDialog("deactivate");
                              }}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedUser(user);
                                setActionDialog("reactivate");
                              }}
                            >
                              <RefreshCw className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedUser(user);
                              setActionDialog("delete");
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Dialogs */}
      <AlertDialog
        open={!!actionDialog}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog === "logout" && "Force Logout User"}
              {actionDialog === "deactivate" && "Deactivate User"}
              {actionDialog === "reactivate" && "Reactivate User"}
              {actionDialog === "delete" && "Delete User Permanently"}
              {actionDialog === "changeRole" && "Change User Role"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog === "logout" &&
                "This will invalidate all active sessions and force the user to log in again."}
              {actionDialog === "deactivate" &&
                "This will deactivate the account and force logout the user."}
              {actionDialog === "reactivate" &&
                "This will reactivate the user account."}
              {actionDialog === "delete" &&
                "This action cannot be undone. This will permanently delete the user account and all associated data."}
              {actionDialog === "changeRole" &&
                "Select a new role for this user."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4 space-y-4">
            {selectedUser && (
              <div className="text-sm">
                <strong>User:</strong> {selectedUser.email}
              </div>
            )}

            {(actionDialog === "logout" || actionDialog === "deactivate") && (
              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Input
                  id="reason"
                  placeholder="Enter reason..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            )}

            {actionDialog === "delete" && (
              <div className="space-y-2">
                <Label htmlFor="confirmation">
                  Type <strong>DELETE</strong> to confirm
                </Label>
                <Input
                  id="confirmation"
                  placeholder="DELETE"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                />
              </div>
            )}

            {actionDialog === "changeRole" && (
              <div className="space-y-2">
                <Label htmlFor="role">New Role</Label>
                <Select value={newRoleId} onValueChange={setNewRoleId}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {roles
                      ?.filter((role: any) => role.name !== "admin")
                      .map((role: any) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={
                (actionDialog === "delete" &&
                  deleteConfirmation !== "DELETE") ||
                (actionDialog === "changeRole" && !newRoleId)
              }
              className={
                actionDialog === "delete"
                  ? "bg-destructive hover:bg-destructive/90"
                  : ""
              }
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
