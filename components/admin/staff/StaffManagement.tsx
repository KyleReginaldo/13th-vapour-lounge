"use client";

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
import { createClient } from "@/lib/supabase/client";
import {
  Clock,
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
import { useEffect, useState } from "react";

type StaffMember = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  role: "admin" | "staff";
  status: "active" | "inactive";
  created_at: string;
  last_login?: string;
  avatar_url?: string;
};

export function StaffManagement() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "staff" as "admin" | "staff",
  });

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      const { data: users } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (users && users.length > 0) {
        const mapped: StaffMember[] = users
          .filter((u: any) => u.role === "admin" || u.role === "staff")
          .map((u: any) => ({
            id: u.id,
            first_name: u.first_name || u.name?.split(" ")[0] || "User",
            last_name:
              u.last_name || u.name?.split(" ").slice(1).join(" ") || "",
            email: u.email || "",
            phone: u.phone || "",
            role: u.role || "staff",
            status: "active",
            created_at: u.created_at,
            last_login: u.last_sign_in_at,
          }));

        if (mapped.length > 0) {
          setStaff(mapped);
          setFilteredStaff(mapped);
          setIsLoading(false);
          return;
        }
      }

      // Fallback mock data
      const mockStaff: StaffMember[] = [
        {
          id: "s1",
          first_name: "Admin",
          last_name: "User",
          email: "admin@vapourlounge.com",
          phone: "+63 917 111 1111",
          role: "admin",
          status: "active",
          created_at: new Date(Date.now() - 365 * 86400000).toISOString(),
          last_login: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "s2",
          first_name: "Maria",
          last_name: "Santos",
          email: "maria@vapourlounge.com",
          phone: "+63 918 222 2222",
          role: "staff",
          status: "active",
          created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
          last_login: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: "s3",
          first_name: "Carlos",
          last_name: "Reyes",
          email: "carlos@vapourlounge.com",
          phone: "+63 919 333 3333",
          role: "staff",
          status: "active",
          created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
          last_login: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: "s4",
          first_name: "Ana",
          last_name: "Lopez",
          email: "ana@vapourlounge.com",
          role: "staff",
          status: "inactive",
          created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
        },
      ];

      setStaff(mockStaff);
      setFilteredStaff(mockStaff);
      setIsLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    let filtered = staff;
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          `${s.first_name} ${s.last_name}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredStaff(filtered);
  }, [staff, searchTerm]);

  const handleToggleStatus = (id: string) => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "active" ? "inactive" : "active" }
          : s
      )
    );
  };

  const handleChangeRole = (id: string, role: "admin" | "staff") => {
    setStaff((prev) => prev.map((s) => (s.id === id ? { ...s, role } : s)));
  };

  const activeCount = staff.filter((s) => s.status === "active").length;
  const adminCount = staff.filter((s) => s.role === "admin").length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading staff...</p>
        </div>
      </div>
    );
  }

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

      <div className="flex flex-col md:flex-row gap-4">
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => (
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
                    {member.phone ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3" /> {member.phone}
                      </div>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.role === "admin" ? "default" : "secondary"
                      }
                    >
                      {member.role === "admin" ? "Admin" : "Staff"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        member.status === "active" ? "default" : "outline"
                      }
                    >
                      {member.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {member.last_login ? (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(member.last_login).toLocaleDateString()}
                      </div>
                    ) : (
                      "Never"
                    )}
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
              ))}
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
                  <div>
                    <Badge
                      variant={
                        selectedMember.role === "admin"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedMember.role}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div>
                    <Badge
                      variant={
                        selectedMember.status === "active"
                          ? "default"
                          : "outline"
                      }
                    >
                      {selectedMember.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Joined:</span>
                  <div>
                    {new Date(selectedMember.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Last Login:</span>
                  <div>
                    {selectedMember.last_login
                      ? new Date(selectedMember.last_login).toLocaleString()
                      : "Never"}
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <label className="text-sm font-medium">Change Role</label>
                <Select
                  value={selectedMember.role}
                  onValueChange={(value: "admin" | "staff") => {
                    handleChangeRole(selectedMember.id, value);
                    setSelectedMember((prev) =>
                      prev ? { ...prev, role: value } : null
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  handleToggleStatus(selectedMember.id);
                  setDetailsOpen(false);
                }}
              >
                {selectedMember.status === "active" ? (
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
                <label className="text-sm font-medium">First Name *</label>
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
                <label className="text-sm font-medium">Last Name *</label>
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
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Role</label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "staff") =>
                  setFormData((prev) => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button disabled={!formData.first_name || !formData.email}>
                Send Invitation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
