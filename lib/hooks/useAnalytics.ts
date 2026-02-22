"use client";

import {
  getCustomerAnalytics as getCustomerAnalyticsAction,
  getDailySales,
  getInventoryInsights,
  getPaymentMethodBreakdown,
  getRevenueByCategory,
  getSalesOverview,
  getTopProducts,
} from "@/app/actions/analytics";
import { getSalesReport } from "@/app/actions/reports";
import { useQuery } from "@tanstack/react-query";

export type DateRange = {
  startDate: string;
  endDate: string;
};

/**
 * Hook to get sales overview with optional date range
 */
export function useSalesOverview(dateRange?: DateRange) {
  return useQuery({
    queryKey: ["sales-overview", dateRange],
    queryFn: async () => {
      const result = await getSalesOverview(dateRange);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch sales overview");
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to get top selling products
 */
export function useTopProducts(limit: number = 10, dateRange?: DateRange) {
  return useQuery({
    queryKey: ["top-products", limit, dateRange],
    queryFn: async () => {
      const result = await getTopProducts(limit, dateRange);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch top products");
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get revenue breakdown by category
 */
export function useRevenueByCategory(dateRange?: DateRange) {
  return useQuery({
    queryKey: ["revenue-by-category", dateRange],
    queryFn: async () => {
      const result = await getRevenueByCategory(dateRange);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch revenue by category");
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get daily sales data for charts
 */
export function useDailySalesData(days: number = 30) {
  return useQuery({
    queryKey: ["daily-sales", days],
    queryFn: async () => {
      const result = await getDailySales(days);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch daily sales data");
      }
      return result.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to get customer analytics
 */
export function useCustomerAnalytics() {
  return useQuery({
    queryKey: ["customer-analytics"],
    queryFn: async () => {
      const result = await getCustomerAnalyticsAction();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch customer analytics");
      }
      return result.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to get inventory insights
 */
export function useInventoryInsights() {
  return useQuery({
    queryKey: ["inventory-insights"],
    queryFn: async () => {
      const result = await getInventoryInsights();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch inventory insights");
      }
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to get payment method breakdown
 */
export function usePaymentMethodBreakdown(dateRange?: DateRange) {
  return useQuery({
    queryKey: ["payment-method-breakdown", dateRange],
    queryFn: async () => {
      const result = await getPaymentMethodBreakdown(dateRange);
      if (!result.success) {
        throw new Error(
          result.error || "Failed to fetch payment method breakdown"
        );
      }
      return result.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Hook to get comprehensive sales report
 */
export function useSalesReport(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ["sales-report", startDate, endDate],
    queryFn: async () => {
      const result = await getSalesReport(startDate, endDate);
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch sales report");
      }
      return result.data;
    },
    enabled: !!startDate && !!endDate,
    staleTime: 10 * 60 * 1000,
  });
}
