import { getPolicy } from "@/app/actions/policies";
import { Separator } from "@/components/ui/separator";
import { POLICY_META, type PolicyKey } from "@/lib/policies";
import { format } from "date-fns";
import { FileText } from "lucide-react";
import Link from "next/link";

interface PolicyPageProps {
  policyKey: PolicyKey;
}

export async function PolicyPageContent({ policyKey }: PolicyPageProps) {
  const result = await getPolicy(policyKey);
  const meta = POLICY_META[policyKey];

  const policy = result.success
    ? result.data!
    : {
        title: meta.label,
        content: "Policy content unavailable.",
        updated_at: null,
      };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="bg-muted/50 border-b">
        <div className="container mx-auto px-4 py-10 sm:py-14 max-w-3xl">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <span>{policy.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">{policy.title}</h1>
              {policy.updated_at && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Last updated{" "}
                  {format(new Date(policy.updated_at), "MMMM d, yyyy")}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="prose prose-gray max-w-none">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {policy.content}
          </div>
        </div>

        <Separator className="my-10" />

        <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
          <p>
            Questions?{" "}
            <Link
              href="/contact"
              className="underline underline-offset-2 hover:text-foreground transition-colors"
            >
              Contact us
            </Link>
          </p>
          <div className="sm:ml-auto flex flex-wrap gap-4">
            {Object.entries(POLICY_META)
              .filter(([k]) => k !== policyKey)
              .map(([k, m]) => (
                <Link
                  key={k}
                  href={m.slug}
                  className="hover:text-foreground transition-colors"
                >
                  {m.label}
                </Link>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
