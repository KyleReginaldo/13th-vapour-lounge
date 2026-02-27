"use client";

import { getAllPolicies, savePolicy } from "@/app/actions/policies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { POLICY_META, type PolicyData, type PolicyKey } from "@/lib/policies";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, FileText, Loader2, RotateCcw, Save } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const POLICY_KEYS = Object.keys(POLICY_META) as PolicyKey[];

type PolicyState = Record<
  PolicyKey,
  { data: PolicyData; draft: string; saving: boolean; dirty: boolean }
>;

interface PoliciesManagerProps {
  initialPolicies: Record<PolicyKey, PolicyData>;
}

export function PoliciesManager({ initialPolicies }: PoliciesManagerProps) {
  const [state, setState] = useState<PolicyState>(() => {
    const s = {} as PolicyState;
    for (const key of POLICY_KEYS) {
      s[key] = {
        data: initialPolicies[key],
        draft: initialPolicies[key].content,
        saving: false,
        dirty: false,
      };
    }
    return s;
  });

  // Reload from server after external changes
  useEffect(() => {
    async function reload() {
      const result = await getAllPolicies();
      if (result.success && result.data) {
        setState((prev) => {
          const next = { ...prev };
          for (const key of POLICY_KEYS) {
            next[key] = {
              ...prev[key],
              data: result.data![key],
              // Only reset draft if not dirty
              draft: prev[key].dirty
                ? prev[key].draft
                : result.data![key].content,
            };
          }
          return next;
        });
      }
    }
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setDraft(key: PolicyKey, value: string) {
    setState((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        draft: value,
        dirty: value !== prev[key].data.content,
      },
    }));
  }

  function resetDraft(key: PolicyKey) {
    setState((prev) => ({
      ...prev,
      [key]: { ...prev[key], draft: prev[key].data.content, dirty: false },
    }));
  }

  async function handleSave(key: PolicyKey) {
    setState((prev) => ({ ...prev, [key]: { ...prev[key], saving: true } }));
    const result = await savePolicy(key, state[key].draft);
    if (result.success && result.data) {
      setState((prev) => ({
        ...prev,
        [key]: {
          data: result.data!,
          draft: result.data!.content,
          saving: false,
          dirty: false,
        },
      }));
      toast.success(`${POLICY_META[key].label} saved`);
    } else {
      setState((prev) => ({ ...prev, [key]: { ...prev[key], saving: false } }));
      toast.error(result.error ?? "Failed to save");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          Policies
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Edit your store&apos;s legal pages. Changes are immediately visible to
          customers.
        </p>
      </div>

      <Tabs defaultValue="policy_terms">
        <TabsList className="flex-wrap h-auto gap-1">
          {POLICY_KEYS.map((key) => (
            <TabsTrigger key={key} value={key} className="relative">
              {POLICY_META[key].label}
              {state[key].dirty && (
                <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {POLICY_KEYS.map((key) => {
          const { data, draft, saving, dirty } = state[key];
          const meta = POLICY_META[key];

          return (
            <TabsContent key={key} value={key} className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{meta.label}</CardTitle>
                      <CardDescription className="mt-1">
                        {meta.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {data.updated_at ? (
                        <Badge
                          variant="outline"
                          className="text-xs whitespace-nowrap"
                        >
                          Saved{" "}
                          {formatDistanceToNow(new Date(data.updated_at), {
                            addSuffix: true,
                          })}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Using default
                        </Badge>
                      )}
                      <Button size="sm" variant="outline" asChild>
                        <Link href={meta.slug} target="_blank">
                          <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                          View page
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(key, e.target.value)}
                    rows={24}
                    className="font-mono text-sm resize-y"
                    placeholder="Enter policy content…"
                  />
                  <p className="text-xs text-muted-foreground">
                    Plain text supported. Use blank lines between paragraphs.
                    Content is displayed exactly as written.
                  </p>
                  <div className="flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!dirty || saving}
                      onClick={() => resetDraft(key)}
                    >
                      <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      disabled={!dirty || saving}
                      onClick={() => handleSave(key)}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      {saving ? "Saving…" : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
