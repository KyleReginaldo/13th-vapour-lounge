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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/client";
import {
  Building2,
  Edit3,
  Mail,
  MapPin,
  Package,
  Phone,
  Plus,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";

type Supplier = {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  status: "active" | "inactive";
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  notes?: string;
  created_at: string;
};

export function SuppliersManagement() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null
  );
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state for adding a supplier
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    notes: "",
  });

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      // Try to load from DB, fallback to mock data
      const { data: dbSuppliers } = await supabase
        .from("suppliers")
        .select("*")
        .order("name");

      if (dbSuppliers && dbSuppliers.length > 0) {
        const mapped: Supplier[] = dbSuppliers.map((s: any) => ({
          id: s.id,
          name: s.name,
          contact_person: s.contact_person || s.contact_name || "",
          email: s.email || "",
          phone: s.phone || "",
          address: s.address || "",
          city: s.city || "",
          status: s.status || "active",
          total_orders: 0,
          total_spent: 0,
          last_order_date: undefined,
          notes: s.notes || "",
          created_at: s.created_at,
        }));
        setSuppliers(mapped);
        setFilteredSuppliers(mapped);
      } else {
        const mockSuppliers: Supplier[] = [
          {
            id: "sup1",
            name: "VUSE Philippines",
            contact_person: "Mark Tan",
            email: "orders@vuse.ph",
            phone: "+63 917 123 4567",
            address: "BGC, Taguig",
            city: "Metro Manila",
            status: "active",
            total_orders: 24,
            total_spent: 450000,
            last_order_date: new Date(Date.now() - 2 * 86400000).toISOString(),
            notes:
              "Primary supplier for all VUSE products. Weekly deliveries on Mondays.",
            created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
          },
          {
            id: "sup2",
            name: "E-Liquid Direct",
            contact_person: "Sarah Lim",
            email: "supply@eliquiddirect.com",
            phone: "+63 918 234 5678",
            address: "Makati Avenue",
            city: "Makati",
            status: "active",
            total_orders: 12,
            total_spent: 180000,
            last_order_date: new Date(Date.now() - 5 * 86400000).toISOString(),
            created_at: new Date(Date.now() - 120 * 86400000).toISOString(),
          },
          {
            id: "sup3",
            name: "Vape Accessories Co.",
            contact_person: "James Yu",
            email: "james@vapeacc.ph",
            phone: "+63 919 345 6789",
            address: "Quezon City",
            city: "Metro Manila",
            status: "inactive",
            total_orders: 5,
            total_spent: 35000,
            last_order_date: new Date(Date.now() - 60 * 86400000).toISOString(),
            created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
          },
        ];
        setSuppliers(mockSuppliers);
        setFilteredSuppliers(mockSuppliers);
      }

      setIsLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    let filtered = suppliers;
    if (searchTerm) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.city.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredSuppliers(filtered);
  }, [suppliers, searchTerm]);

  const handleAddSupplier = async () => {
    const newSupplier: Supplier = {
      id: Date.now().toString(),
      ...formData,
      status: "active",
      total_orders: 0,
      total_spent: 0,
      created_at: new Date().toISOString(),
    };

    // In a real implementation, insert into database
    setSuppliers((prev) => [...prev, newSupplier]);
    setAddDialogOpen(false);
    setFormData({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      notes: "",
    });
  };

  const handleToggleStatus = (id: string) => {
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "active" ? "inactive" : "active" }
          : s
      )
    );
  };

  const activeCount = suppliers.filter((s) => s.status === "active").length;
  const totalSpent = suppliers.reduce((sum, s) => sum + s.total_spent, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading suppliers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Suppliers
            </CardTitle>
            <Building2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
            <p className="text-xs text-muted-foreground">
              of {suppliers.length} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliers.reduce((sum, s) => sum + s.total_orders, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Purchase orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{totalSpent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              All time procurement
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Supplier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suppliers</CardTitle>
          <CardDescription>Manage your vendor relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead>Contact Person</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>{supplier.contact_person}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {supplier.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {supplier.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-3 w-3" /> {supplier.city}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        supplier.status === "active" ? "default" : "secondary"
                      }
                    >
                      {supplier.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>{supplier.total_orders}</TableCell>
                  <TableCell className="font-bold">
                    ₱{supplier.total_spent.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedSupplier(supplier);
                          setDetailsOpen(true);
                        }}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Supplier Details */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedSupplier?.name}</DialogTitle>
            <DialogDescription>Supplier details and history</DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Contact:</span>
                  <div className="font-medium">
                    {selectedSupplier.contact_person}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <div>{selectedSupplier.email}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <div>{selectedSupplier.phone}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <div>
                    {selectedSupplier.address}, {selectedSupplier.city}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Orders:</span>
                  <div className="font-bold">
                    {selectedSupplier.total_orders}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Spent:</span>
                  <div className="font-bold">
                    ₱{selectedSupplier.total_spent.toLocaleString()}
                  </div>
                </div>
              </div>
              {selectedSupplier.notes && (
                <div className="bg-muted p-3 rounded text-sm">
                  <span className="font-medium">Notes:</span>{" "}
                  {selectedSupplier.notes}
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleToggleStatus(selectedSupplier.id)}
                >
                  {selectedSupplier.status === "active"
                    ? "Deactivate"
                    : "Activate"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Supplier Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
            <DialogDescription>
              Add a new vendor to your supplier list
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Company Name *</label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., VUSE Philippines"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Contact Person *</label>
              <Input
                value={formData.contact_person}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    contact_person: e.target.value,
                  }))
                }
                placeholder="Full name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="email@company.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+63 9XX XXX XXXX"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Address</label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  placeholder="Street address"
                />
              </div>
              <div>
                <label className="text-sm font-medium">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                  }
                  placeholder="City"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Input
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Additional notes..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddSupplier}
                disabled={!formData.name || !formData.contact_person}
              >
                Add Supplier
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
