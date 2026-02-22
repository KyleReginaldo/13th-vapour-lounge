"use server";

import { withErrorHandling, type ActionResponse } from "@/lib/actions/utils";
import { logAudit } from "@/lib/auth/audit";
import { requireRole } from "@/lib/auth/supabase-auth";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type LegalDocument = {
  id: string;
  type:
    | "tin"
    | "business_permit"
    | "mayors_permit"
    | "bir_registration"
    | "other";
  name: string;
  number: string; // Document number (e.g., TIN number)
  issuedDate?: string;
  expiryDate?: string;
  fileUrl?: string;
  notes?: string;
};

export type LegalDocuments = {
  documents: LegalDocument[];
};

const defaultLegalDocuments: LegalDocuments = {
  documents: [],
};

/**
 * Get all legal documents
 */
export const getLegalDocuments = withErrorHandling(
  async (): Promise<ActionResponse<LegalDocuments>> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("shop_settings")
      .select("value")
      .eq("key", "legal_documents")
      .single();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    const documents = data?.value || defaultLegalDocuments;

    return {
      success: true,
      data: documents as LegalDocuments,
    };
  }
);

/**
 * Add a new legal document
 */
export const addLegalDocument = withErrorHandling(
  async (document: Omit<LegalDocument, "id">): Promise<ActionResponse> => {
    const user = await requireRole(["admin"]);
    const supabase = await createClient();

    // Get current documents
    const currentResult = await getLegalDocuments();
    if (!currentResult.success || !currentResult.data) {
      throw new Error("Failed to get current legal documents");
    }

    const currentDocuments = currentResult.data;

    // Add new document with generated ID
    const newDocument: LegalDocument = {
      ...document,
      id: crypto.randomUUID(),
    };

    const updatedDocuments: LegalDocuments = {
      documents: [...currentDocuments.documents, newDocument],
    };

    // Upsert
    const { error } = await supabase.from("shop_settings").upsert(
      {
        key: "legal_documents",
        value: updatedDocuments,
        description: "Legal documents and permits for the business",
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "key",
      }
    );

    if (error) {
      throw error;
    }

    // Audit log
    await logAudit({
      action: "create",
      entityType: "setting",
      entityId: `legal_document_${newDocument.id}`,
      newValue: newDocument as Record<string, any>,
    });

    revalidatePath("/admin/settings");

    return {
      success: true,
      message: "Legal document added successfully",
      data: newDocument,
    };
  }
);

/**
 * Update an existing legal document
 */
export const updateLegalDocument = withErrorHandling(
  async (
    id: string,
    updates: Partial<Omit<LegalDocument, "id">>
  ): Promise<ActionResponse> => {
    const user = await requireRole(["admin"]);
    const supabase = await createClient();

    // Get current documents
    const currentResult = await getLegalDocuments();
    if (!currentResult.success || !currentResult.data) {
      throw new Error("Failed to get current legal documents");
    }

    const currentDocuments = currentResult.data;
    const documentIndex = currentDocuments.documents.findIndex(
      (doc) => doc.id === id
    );

    if (documentIndex === -1) {
      throw new Error("Document not found");
    }

    const oldDocument = currentDocuments.documents[documentIndex];

    // Update document
    const updatedDocument: LegalDocument = {
      ...oldDocument,
      ...updates,
      id, // Ensure ID doesn't change
    };

    const updatedDocuments: LegalDocuments = {
      documents: currentDocuments.documents.map((doc) =>
        doc.id === id ? updatedDocument : doc
      ),
    };

    // Upsert
    const { error } = await supabase.from("shop_settings").upsert(
      {
        key: "legal_documents",
        value: updatedDocuments,
        description: "Legal documents and permits for the business",
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "key",
      }
    );

    if (error) {
      throw error;
    }

    // Audit log
    await logAudit({
      action: "update",
      entityType: "setting",
      entityId: `legal_document_${id}`,
      oldValue: oldDocument as Record<string, any>,
      newValue: updatedDocument as Record<string, any>,
    });

    revalidatePath("/admin/settings");

    return {
      success: true,
      message: "Legal document updated successfully",
    };
  }
);

/**
 * Delete a legal document
 */
export const deleteLegalDocument = withErrorHandling(
  async (id: string): Promise<ActionResponse> => {
    const user = await requireRole(["admin"]);
    const supabase = await createClient();

    // Get current documents
    const currentResult = await getLegalDocuments();
    if (!currentResult.success || !currentResult.data) {
      throw new Error("Failed to get current legal documents");
    }

    const currentDocuments = currentResult.data;
    const document = currentDocuments.documents.find((doc) => doc.id === id);

    if (!document) {
      throw new Error("Document not found");
    }

    const updatedDocuments: LegalDocuments = {
      documents: currentDocuments.documents.filter((doc) => doc.id !== id),
    };

    // Upsert
    const { error } = await supabase.from("shop_settings").upsert(
      {
        key: "legal_documents",
        value: updatedDocuments,
        description: "Legal documents and permits for the business",
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "key",
      }
    );

    if (error) {
      throw error;
    }

    // Audit log
    await logAudit({
      action: "delete",
      entityType: "setting",
      entityId: `legal_document_${id}`,
      oldValue: document as Record<string, any>,
    });

    revalidatePath("/admin/settings");

    return {
      success: true,
      message: "Legal document deleted successfully",
    };
  }
);
