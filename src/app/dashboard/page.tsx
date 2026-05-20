"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@supabase/supabase-js";
import { CheckCircle2, Database, Loader2, LogOut, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";

type Item = {
  id: string;
  user_id: string;
  title: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

const itemSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120, "Keep the title under 120 characters"),
  notes: z.string().max(1000, "Keep notes under 1,000 characters").optional(),
});

type ItemValues = z.infer<typeof itemSchema>;

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ItemValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { title: "", notes: "" },
  });

  useEffect(() => {
    async function boot() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/");
        return;
      }

      setUser(data.session.user);
      await loadItems();
      setLoading(false);
    }

    boot();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/");
      else setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function loadItems() {
    setError(null);
    const { data, error: loadError } = await supabase
      .from("items")
      .select("id,user_id,title,notes,created_at,updated_at")
      .order("created_at", { ascending: false });

    if (loadError) {
      setError(loadError.message);
      setItems([]);
      return;
    }

    setItems(data ?? []);
  }

  async function saveItem(values: ItemValues) {
    if (!user) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    const payload = {
      title: values.title.trim(),
      notes: values.notes?.trim() ?? "",
    };

    const result = editingItem
      ? await supabase
          .from("items")
          .update(payload)
          .eq("id", editingItem.id)
          .select("id,user_id,title,notes,created_at,updated_at")
          .single()
      : await supabase
          .from("items")
          .insert({ ...payload, user_id: user.id })
          .select("id,user_id,title,notes,created_at,updated_at")
          .single();

    setSaving(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (editingItem) {
      setItems((current) => current.map((item) => (item.id === result.data.id ? result.data : item)));
      setMessage("Item updated.");
    } else {
      setItems((current) => [result.data, ...current]);
      setMessage("Item created.");
    }

    setEditingItem(null);
    form.reset({ title: "", notes: "" });
  }

  async function deleteItem(item: Item) {
    setError(null);
    setMessage(null);

    const { error: deleteError } = await supabase.from("items").delete().eq("id", item.id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setItems((current) => current.filter((existing) => existing.id !== item.id));
    if (editingItem?.id === item.id) {
      setEditingItem(null);
      form.reset({ title: "", notes: "" });
    }
    setMessage("Item deleted.");
  }

  function startEdit(item: Item) {
    setEditingItem(item);
    setMessage(null);
    setError(null);
    form.reset({ title: item.title, notes: item.notes });
  }

  function cancelEdit() {
    setEditingItem(null);
    form.reset({ title: "", notes: "" });
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" /> Loading dashboard...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader className="gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="gap-1.5" variant="secondary">
                  <CheckCircle2 className="size-3.5" /> Authenticated
                </Badge>
                <Badge variant="outline">RLS protected</Badge>
              </div>
              <div>
                <CardTitle className="text-2xl font-semibold tracking-tight">Protected Items</CardTitle>
                <CardDescription className="mt-1">
                  Create, list, edit, and delete items owned by your logged-in Supabase user.
                </CardDescription>
              </div>
            </div>
            <CardAction className="flex items-center gap-2">
              <Button className="gap-2" onClick={loadItems} type="button" variant="outline">
                <RefreshCw className="size-4" /> Refresh
              </Button>
              <Button className="gap-2" onClick={logout} variant="outline">
                <LogOut className="size-4" /> Logout
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Signed in as</div>
                <div className="truncate font-medium text-foreground">{user?.email}</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Database className="size-4" /> {items.length} visible item{items.length === 1 ? "" : "s"}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card className="h-fit border-border/70 bg-card shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{editingItem ? "Edit item" : "Create item"}</CardTitle>
                  <CardDescription className="mt-1">One simple owned row in Supabase.</CardDescription>
                </div>
                {editingItem ? (
                  <Button onClick={cancelEdit} size="icon" type="button" variant="ghost">
                    <X className="size-4" />
                  </Button>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={form.handleSubmit(saveItem)}>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="title">
                    Title
                  </label>
                  <Input id="title" placeholder="Example: Call broker Friday" {...form.register("title")} />
                  {form.formState.errors.title ? (
                    <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground" htmlFor="notes">
                    Notes
                  </label>
                  <Textarea id="notes" className="min-h-28 resize-none" placeholder="Optional details" {...form.register("notes")} />
                  {form.formState.errors.notes ? (
                    <p className="text-xs text-destructive">{form.formState.errors.notes.message}</p>
                  ) : null}
                </div>

                <Button className="h-10 w-full gap-2" disabled={saving} type="submit">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  {editingItem ? "Save changes" : "Create item"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card shadow-sm">
            <CardHeader>
              <CardTitle>Your items</CardTitle>
              <CardDescription>Only rows owned by this authenticated user are returned.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              ) : null}

              {message ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                  {message}
                </div>
              ) : null}

              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-muted/30 px-6 py-12 text-center">
                  <p className="text-sm font-medium text-foreground">No items yet.</p>
                  <p className="mt-1 text-sm text-muted-foreground">Create the first row to prove authenticated CRUD.</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border">
                  <ul className="divide-y">
                    {items.map((item) => (
                      <li className="bg-card p-4 transition-colors hover:bg-muted/30" key={item.id}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 space-y-1">
                            <div className="font-medium text-foreground">{item.title}</div>
                            {item.notes ? <p className="whitespace-pre-wrap text-sm text-muted-foreground">{item.notes}</p> : null}
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                              <span>Created {new Date(item.created_at).toLocaleString()}</span>
                              <Separator className="h-3" orientation="vertical" />
                              <span className="font-mono">{item.id.slice(0, 8)}</span>
                            </div>
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <Button className="gap-1" onClick={() => startEdit(item)} type="button" variant="outline">
                              <Pencil className="size-3.5" /> Edit
                            </Button>
                            <Button className="gap-1 text-destructive hover:text-destructive" onClick={() => deleteItem(item)} type="button" variant="outline">
                              <Trash2 className="size-3.5" /> Delete
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
