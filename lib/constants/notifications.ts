/**
 * Notification type constants — import these everywhere instead of raw strings.
 */
export const NOTIF_TYPES = {
  // Orders / POS
  NEW_ORDER: "new_order",
  POS_SALE: "pos_sale",
  // Staff
  CLOCK_IN: "clock_in",
  CLOCK_OUT: "clock_out",
  CASH_DISCREPANCY: "cash_discrepancy",
  STAFF_CREATED: "staff_created",
  ROLE_CHANGED: "role_changed",
  // Inventory
  INVENTORY_ADJUSTED: "inventory_adjusted",
  INVENTORY_BATCH_CREATED: "inventory_batch_created",
  INVENTORY_BATCH_UPDATED: "inventory_batch_updated",
  INVENTORY_BATCH_DELETED: "inventory_batch_deleted",
  LOW_STOCK: "low_stock",
  OUT_OF_STOCK: "out_of_stock",
  CRITICAL_STOCK: "critical_stock",
  EXPIRING_STOCK: "expiring_stock",
  // Products
  PRODUCT_CREATED: "product_created",
  PRODUCT_UPDATED: "product_updated",
  PRODUCT_DELETED: "product_deleted",
  // Suppliers
  SUPPLIER_CREATED: "supplier_created",
  SUPPLIER_UPDATED: "supplier_updated",
  SUPPLIER_DELETED: "supplier_deleted",
  // Purchase Orders
  PO_CREATED: "po_created",
  PO_STATUS_CHANGED: "po_status_changed",
  PO_RECEIVED: "po_received",
  PO_CANCELLED: "po_cancelled",
} as const;

/** Cash discrepancy threshold (₱) — differences at or below this are ignored */
export const CASH_DIFF_THRESHOLD = 50;
