import { changeUserRole, promoteToAdmin } from "@/app/actions/users";

export default async function PromoteAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; role?: string }>;
}) {
  const params = await searchParams;
  const email = params.email;
  const role = params.role as "admin" | "staff" | "customer" | undefined;

  let result = null;

  if (email && role) {
    result = await changeUserRole(email, role);
  } else if (email) {
    result = await promoteToAdmin(email);
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">User Role Management</h1>

      {result && (
        <div
          className={`p-4 rounded mb-6 ${
            result.success
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          <p className="font-semibold">{result.message || result.error}</p>
          {result.data && (
            <pre className="mt-2 text-sm overflow-auto">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Promote User to Admin</h2>
        <form action="" method="get" className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              User Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="user@example.com"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            Promote to Admin
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Change User Role</h2>
        <form action="" method="get" className="space-y-4">
          <div>
            <label
              htmlFor="email2"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              User Email
            </label>
            <input
              type="email"
              name="email"
              id="email2"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              New Role
            </label>
            <select
              name="role"
              id="role"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select a role</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="customer">Customer</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Change Role
          </button>
        </form>
      </div>

      <div className="mt-6 text-center">
        <a href="/" className="text-purple-600 hover:underline">
          Go to Home →
        </a>
      </div>
    </div>
  );
}
