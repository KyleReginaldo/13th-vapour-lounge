"use server";

import {
  success,
  withErrorHandling,
  type ActionResponse,
} from "@/lib/actions/utils";
import { getAllAuditLogs as getAuditLogsLib } from "@/lib/auth/audit";
import { requireRole } from "@/lib/auth/roles";

/**
 * Get all audit logs with pagination and filters
 */
export const getAuditLogs = withErrorHandling(
  async (params?: {
    page?: number;
    pageSize?: number;
    action?: string;
    entityType?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<ActionResponse> => {
    await requireRole(["admin"]);

    const { page = 1, pageSize = 50 } = params || {};

    const result = await getAuditLogsLib(page, pageSize);

    // Apply additional filters if provided
    let filteredLogs = result.logs;

    if (params?.action) {
      filteredLogs = filteredLogs.filter((log: any) =>
        log.action.toLowerCase().includes(params.action!.toLowerCase())
      );
    }

    if (params?.entityType) {
      filteredLogs = filteredLogs.filter(
        (log: any) => log.entity_type === params.entityType
      );
    }

    if (params?.userId) {
      filteredLogs = filteredLogs.filter(
        (log: any) => log.user_id === params.userId
      );
    }

    if (params?.startDate) {
      filteredLogs = filteredLogs.filter(
        (log: any) => new Date(log.created_at) >= new Date(params.startDate!)
      );
    }

    if (params?.endDate) {
      filteredLogs = filteredLogs.filter(
        (log: any) => new Date(log.created_at) <= new Date(params.endDate!)
      );
    }

    return success({
      logs: filteredLogs,
      totalCount: filteredLogs.length,
      currentPage: page,
      totalPages: Math.ceil(filteredLogs.length / pageSize),
    });
  }
);
