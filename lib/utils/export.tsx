"use client";

import { Button } from "@/components/ui/button";
import { Download, FileText, Printer } from "lucide-react";
import { toast } from "sonner";

/**
 * Convert data to CSV format
 */
export function convertToCSV(data: any[], headers?: string[]): string {
  if (!data || data.length === 0) return "";

  const keys = headers || Object.keys(data[0]);
  const csvHeaders = keys.join(",");

  const csvRows = data.map((row) => {
    return keys
      .map((key) => {
        const value = row[key];
        // Escape commas and quotes
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(",");
  });

  return [csvHeaders, ...csvRows].join("\n");
}

/**
 * Download CSV file
 */
export function downloadCSV(data: any[], filename: string, headers?: string[]) {
  try {
    const csv = convertToCSV(data, headers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  } catch (error) {
    console.error("CSV export error:", error);
    toast.error("Failed to export CSV");
  }
}

/**
 * Download JSON file
 */
export function downloadJSON(data: any, filename: string) {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exported successfully");
  } catch (error) {
    console.error("JSON export error:", error);
    toast.error("Failed to export JSON");
  }
}

/**
 * Print content
 */
export function printContent(content: HTMLElement, title?: string) {
  try {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print");
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>${title || "Print"}</title>
          <style>
            @media print {
              @page { margin: 1cm; }
              body { margin: 0; }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              font-size: 12px;
              line-height: 1.5;
              color: #000;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1em 0;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            h1, h2, h3 {
              margin-top: 0;
            }
            .no-print {
              display: none;
            }
          </style>
        </head>
        <body>
          ${content.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    toast.success("Print dialog opened");
  } catch (error) {
    console.error("Print error:", error);
    toast.error("Failed to print");
  }
}

/**
 * Export buttons component
 */
type ExportButtonsProps = {
  data: any[];
  filename: string;
  headers?: string[];
  className?: string;
};

export function ExportButtons({
  data,
  filename,
  headers,
  className,
}: ExportButtonsProps) {
  return (
    <div className={`flex gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadCSV(data, filename, headers)}
        disabled={!data || data.length === 0}
      >
        <Download className="h-4 w-4 mr-2" />
        Export CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadJSON(data, filename)}
        disabled={!data || data.length === 0}
      >
        <FileText className="h-4 w-4 mr-2" />
        Export JSON
      </Button>
    </div>
  );
}

/**
 * Print button component
 */
type PrintButtonProps = {
  contentRef: React.RefObject<HTMLElement>;
  title?: string;
  className?: string;
};

export function PrintButton({
  contentRef,
  title,
  className,
}: PrintButtonProps) {
  const handlePrint = () => {
    if (contentRef.current) {
      printContent(contentRef.current, title);
    } else {
      toast.error("Nothing to print");
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handlePrint}
      className={className}
    >
      <Printer className="h-4 w-4 mr-2" />
      Print
    </Button>
  );
}
