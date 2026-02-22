"use client";

import { changeStaffRole, createStaffMember } from "@/app/actions/staff";
import { deactivateUser, reactivateUser } from "@/app/actions/user-management";
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
import {
  Edit3,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type RoleRecord = { id: string; name: string };

type StaffRecord = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  date_of_birth: string;
  is_active: boolean | null;
  role_id: string;
  role: RoleRecord | null;
  created_at: string | null;
  image: string | null;
};

interface StaffManagementProps {
  initialStaff: StaffRecord[];
  roles: RoleRecord[];
}

const EMPTY_FORM = {
  first_name: "",
  last_name: "",
  middle_name: "",
  email: "",
  password: "",
  contact_number: "",
  date_of_birth: "",
  role_id: "",
};

export function StaffManagement({ initialStaff, roles }: StaffManagementProps) {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffRecord[]>(initialStaff);
  const [filteredStaff, setFilteredStaff] =
    useState<StaffRecord[]>(initialStaff);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<StaffRecord | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  useEffect(() => {
    setStaff(initialStaff);
  }, [initialStaff]);

  useEffect(() => {
    let filtered = staff;
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          `${s.first_name} ${s.last_name}`.toLowerCase().includes(lower) ||
          s.email.toLowerCase().includes(lower)
      );
    }
    setFilteredStaff(filtered);
  }, [staff, searchTerm]);

  const handleToggleActive = async (member: StaffRecord) => {
    setIsSubmitting(true);
    try {
      const result =
        member.is_active !== false
          ? await deactivateUser(member.id, "Deactivated by admin")
          : await reactivateUser(member.id);
      if (result?.success) {
        toast.success(
          member.is_active
            ? "Staff member deactivated"
            : "Staff member activated"
        );
        setDetailsOpen(false);
        router.refresh();
      } else {
        toast.error(result?.message ?? "Failed to update status");
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangeRole = async (member: StaffRecord, roleId: string) => {
    setIsSubmitting(true);
    try {
      const result = await changeStaffRole(member.id, roleId);
      if (result?.success) {
        toast.success("Role updated");
        router.refresh();
      } else {
        toast.error(result?.message ?? "Failed to update role");
      }
    } catch {
      toast.error("Failed to update role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStaff = async () => {
    setIsSubmitting(true);
    try {
      const result = await createStaffMember(formData);
      if (result?.success) {
        toast.success("Staff member created successfully");
        setAddDialogOpen(false);
        setFormData(EMPTY_FORM);
        router.refresh();
      } else {
        toast.error(result?.message ?? "Failed to create staff member");
      }
    } catch {
      toast.error("Failed to create staff member");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCount = staff.filter((s) => s.is_active !== false).length;
  const adminCount = staff.filter((s) => s.role?.name === "admin").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-xs text-muted-foreground">
              {activeCount} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{adminCount}</div>
            <p className="text-xs text-muted-foreground">Full access</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {staff.length - adminCount}
            </div>
            <p className="text-xs text-muted-foreground">Limited access</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Staff
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>
            Manage your team and their access levels
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No staff members found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.first_name} {member.last_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3" /> {member.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      {member.contact_number ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" /> {member.contact_number}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.role?.name === "admin"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {member.role?.name ?? "staff"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.is_active !== false ? "default" : "outline"
                        }
                      >
                        {member.is_active !== false ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.created_at
                        ? new Date(member.created_at).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedMember(member);
                          setDetailsOpen(true);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Staff Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedMember?.first_name} {selectedMember?.last_name}
            </DialogTitle>
            <DialogDescription>{selectedMember?.email}</DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Role:</span>
                  <div className="mt-1">
                    <Badge
                      variant={
                        selectedMember.role?.name === "admin"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedMember.role?.name ?? "staff"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="mt-1">
                    <Badge
                      variant={
                        selectedMember.is_active !== false
                          ? "default"
                          : "outline"
                      }
                    >
                      {selectedMember.is_active !== false
                        ? "Active"
                        : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Contact:</span>
                  <div>{selectedMember.contact_number || "—"}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Joined:</span>
                  <div>
                    {selectedMember.created_at
                      ? new Date(selectedMember.created_at).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label className="text-sm font-medium">Change Role</Label>
                <Select
                  value={selectedMember.role_id}
                  disabled={isSubmitting}
                  onValueChange={(roleId) => {
                    handleChangeRole(selectedMember, roleId);
                    const newRole = roles.find((r) => r.id === roleId) ?? null;
                    setSelectedMember((prev) =>
                      prev ? { ...prev, role_id: roleId, role: newRole } : null
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full"
                disabled={isSubmitting}
                onClick={() => handleToggleActive(selectedMember)}
              >
                {selectedMember.is_active !== false ? (
                  <>
                    <UserX className="h-4 w-4 mr-2" /> Deactivate
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 mr-2" /> Activate
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Staff Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
            <DialogDescription>Invite a new team member</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">First Name *</Label>
                <Input
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      first_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Last Name *</Label>
                <Input
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      last_name: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Password *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Contact Number *</Label>
                <Input
                  value={formData.contact_number}
                  placeholder="+63 9XX XXX XXXX"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      contact_number: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Date of Birth *</Label>
                <Input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      date_of_birth: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium">Role *</Label>
              <Select
                value={formData.role_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, role_id: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name.charAt(0).toUpperCase() + r.name.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAddDialogOpen(false);
                  setFormData(EMPTY_FORM);
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={
                  isSubmitting ||
                  !formData.first_name ||
                  !formData.last_name ||
                  !formData.email ||
                  !formData.password ||
                  !formData.contact_number ||
                  !formData.date_of_birth ||
                  !formData.role_id
                }
                onClick={handleAddStaff}
              >
                Create Staff Member
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
