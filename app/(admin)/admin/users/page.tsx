import { UserManagement } from "@/components/admin/users/UserManagement";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Management | Admin",
  description: "Manage user accounts, roles, and permissions",
};

export default function UsersPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage all user accounts, roles, and access control
        </p>
      </div>
      <UserManagement />
    </div>
  );
}
