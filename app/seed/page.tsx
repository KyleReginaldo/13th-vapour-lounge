import { seedDatabase } from "@/app/actions/seed";

export default async function SeedPage() {
  const result = await seedDatabase();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Database Seeding</h1>

      <div
        className={`p-4 rounded ${result.success ? "bg-green-100" : "bg-red-100"}`}
      >
        <p className="font-semibold">{result.message}</p>
        {result.data && (
          <pre className="mt-4 text-sm overflow-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        )}
      </div>

      <div className="mt-6">
        <a href="/admin" className="text-blue-600 hover:underline">
          Go to Admin Dashboard →
        </a>
      </div>
    </div>
  );
}
