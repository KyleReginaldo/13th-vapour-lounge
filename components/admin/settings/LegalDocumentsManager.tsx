"use client";

import {
  addLegalDocument,
  deleteLegalDocument,
  getLegalDocuments,
  updateLegalDocument,
  type LegalDocument,
} from "@/app/actions/legal-documents";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, isPast } from "date-fns";
import {
  AlertCircle,
  Edit,
  ExternalLink,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const documentTypes = [
  { value: "tin", label: "Tax Identification Number (TIN)" },
  { value: "business_permit", label: "Business Permit" },
  { value: "mayors_permit", label: "Mayor's Permit" },
  { value: "bir_registration", label: "BIR Registration" },
  { value: "other", label: "Other" },
] as const;

export function LegalDocumentsManager() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [deleteDocumentId, setDeleteDocumentId] = useState<string | null>(null);
  const [editingDocument, setEditingDocument] = useState<LegalDocument | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState({
    type: "tin" as LegalDocument["type"],
    name: "",
    number: "",
    issuedDate: "",
    expiryDate: "",
    fileUrl: "",
    notes: "",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["legal-documents"],
    queryFn: async () => {
      const result = await getLegalDocuments();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch legal documents");
      }
      return result.data!;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (document: Omit<LegalDocument, "id">) => {
      const result = await addLegalDocument(document);
      if (!result.success) {
        throw new Error(result.error || "Failed to add document");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-documents"] });
      toast.success("Document added successfully");
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<LegalDocument, "id">>;
    }) => {
      const result = await updateLegalDocument(id, updates);
      if (!result.success) {
        throw new Error(result.error || "Failed to update document");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-documents"] });
      toast.success("Document updated successfully");
      setIsEditDialogOpen(false);
      setEditingDocument(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await deleteLegalDocument(id);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete document");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["legal-documents"] });
      toast.success("Document deleted successfully");
      setDeleteDocumentId(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      type: "tin",
      name: "",
      number: "",
      issuedDate: "",
      expiryDate: "",
      fileUrl: "",
      notes: "",
    });
  };

  const handleAdd = () => {
    addMutation.mutate(formData);
  };

  const handleEdit = () => {
    if (!editingDocument) return;
    updateMutation.mutate({
      id: editingDocument.id,
      updates: formData,
    });
  };

  const openEditDialog = (document: LegalDocument) => {
    setEditingDocument(document);
    setFormData({
      type: document.type,
      name: document.name,
      number: document.number,
      issuedDate: document.issuedDate || "",
      expiryDate: document.expiryDate || "",
      fileUrl: document.fileUrl || "",
      notes: document.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const getDocumentTypeLabel = (type: string) => {
    return documentTypes.find((t) => t.value === type)?.label || type;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    return isPast(new Date(expiryDate));
  };

  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return !isPast(expiry) && expiry <= thirtyDaysFromNow;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Legal Documents & Permits
          </CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const FormFields = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Document Type *</Label>
        <Select
          value={formData.type}
          onValueChange={(value: LegalDocument["type"]) =>
            setFormData({ ...formData, type: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {documentTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Document Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Business Permit 2024"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="number">Document Number *</Label>
        <Input
          id="number"
          value={formData.number}
          onChange={(e) => setFormData({ ...formData, number: e.target.value })}
          placeholder="e.g., TIN-123-456-789"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="issuedDate">Issued Date</Label>
          <Input
            id="issuedDate"
            type="date"
            value={formData.issuedDate}
            onChange={(e) =>
              setFormData({ ...formData, issuedDate: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <Input
            id="expiryDate"
            type="date"
            value={formData.expiryDate}
            onChange={(e) =>
              setFormData({ ...formData, expiryDate: e.target.value })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="fileUrl">File URL</Label>
        <Input
          id="fileUrl"
          type="url"
          value={formData.fileUrl}
          onChange={(e) =>
            setFormData({ ...formData, fileUrl: e.target.value })
          }
          placeholder="https://..."
        />
        <p className="text-xs text-muted-foreground">
          Upload file to storage and paste URL, or link to Google Drive/Dropbox
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes..."
          rows={3}
        />
      </div>
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Legal Documents & Permits
              </CardTitle>
              <CardDescription>
                Manage business permits, licenses, and legal documents
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add Legal Document</DialogTitle>
                  <DialogDescription>
                    Add a new legal document or permit to your records
                  </DialogDescription>
                </DialogHeader>
                <FormFields />
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAdd}
                    disabled={
                      addMutation.isPending ||
                      !formData.name ||
                      !formData.number
                    }
                  >
                    {addMutation.isPending ? "Adding..." : "Add Document"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {data && data.documents.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Number</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">
                        {getDocumentTypeLabel(doc.type)}
                      </TableCell>
                      <TableCell>{doc.name}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {doc.number}
                      </TableCell>
                      <TableCell>
                        {doc.expiryDate
                          ? format(new Date(doc.expiryDate), "MMM dd, yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {isExpired(doc.expiryDate) ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Expired
                          </Badge>
                        ) : isExpiringSoon(doc.expiryDate) ? (
                          <Badge variant="outline" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Expiring Soon
                          </Badge>
                        ) : (
                          <Badge variant="default">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.fileUrl && (
                            <Button size="sm" variant="ghost" asChild>
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(doc)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteDocumentId(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No legal documents added yet
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Legal Document</DialogTitle>
            <DialogDescription>Update document information</DialogDescription>
          </DialogHeader>
          <FormFields />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingDocument(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={
                updateMutation.isPending || !formData.name || !formData.number
              }
            >
              {updateMutation.isPending ? "Updating..." : "Update Document"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteDocumentId}
        onOpenChange={() => setDeleteDocumentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this document from your records. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDocumentId) {
                  deleteMutation.mutate(deleteDocumentId);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
