import { NotificationsPage } from "@/components/admin/notifications/NotificationsPage";
import { getAdminNotifications } from "@/app/actions/notifications";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    type?: string;
    read?: string;
    from?: string;
    to?: string;
  }>;
}

export default async function AdminNotificationsPage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1") || 1;
  const type = params.type || undefined;
  const isRead =
    params.read === "true" ? true : params.read === "false" ? false : undefined;
  const startDate = params.from || undefined;
  const endDate = params.to || undefined;

  const result = await getAdminNotifications({
    page,
    pageSize: 25,
    type,
    isRead,
    startDate,
    endDate,
  });

  const notifications = result?.data?.notifications ?? [];
  const total = result?.data?.total ?? 0;

  return (
    <NotificationsPage
      notifications={notifications}
      total={total}
      page={page}
      pageSize={25}
      currentType={type}
      currentRead={params.read}
      currentFrom={params.from}
      currentTo={params.to}
    />
  );
}
