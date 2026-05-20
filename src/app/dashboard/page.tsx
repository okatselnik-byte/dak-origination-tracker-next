"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import type { User } from "@supabase/supabase-js";
import { CheckCircle2, Loader2, LogOut, Mail, Pencil, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        <Loader2 className="mr-2 size-4 animate-spin" /> Loading dashboard...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-56 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="flex h-14 items-center gap-3 border-b border-slate-200 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1B2A4A] text-white">
            <Mail className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-slate-900">Dak Tracker</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400">Bravo Capital</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <div className="flex w-full items-center gap-2.5 rounded-lg bg-[#1B2A4A] px-3 py-2 text-[13px] font-medium text-white">
            <CheckCircle2 className="size-4" /> Items
          </div>
        </nav>

        <div className="border-t border-slate-200 px-4 py-3">
          <div className="text-[11px] font-medium text-slate-500">Signed in</div>
          <div className="truncate text-[11px] text-slate-400">{user?.email}</div>
        </div>
      </aside>

      <main className="min-h-screen p-4 md:ml-56 md:p-6">
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Protected Items</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              Create, list, edit, and delete one simple item type owned by {user?.email}.
            </p>
          </div>
          <Button className="gap-2 self-start" onClick={logout} variant="outline">
            <LogOut className="size-4" /> Logout
          </Button>
        </header>

        <section className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <form
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            onSubmit={form.handleSubmit(saveItem)}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {editingItem ? "Edit item" : "Create item"}
                </h3>
                <p className="mt-1 text-xs text-slate-500">Rows are protected by user-owned RLS.</p>
              </div>
              {editingItem ? (
                <button
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  onClick={cancelEdit}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>

            <label className="block text-xs font-medium text-slate-600" htmlFor="title">
              Title
            </label>
            <input
              id="title"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
              placeholder="Example: Call broker Friday"
              {...form.register("title")}
            />
            {form.formState.errors.title ? (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.title.message}</p>
            ) : null}

            <label className="mt-4 block text-xs font-medium text-slate-600" htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              className="mt-1 min-h-28 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
              placeholder="Optional details"
              {...form.register("notes")}
            />
            {form.formState.errors.notes ? (
              <p className="mt-1 text-xs text-red-600">{form.formState.errors.notes.message}</p>
            ) : null}

            <Button className="mt-4 h-10 w-full gap-2 bg-[#1B2A4A] text-white hover:bg-[#25385f]" disabled={saving} type="submit">
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              {editingItem ? "Save changes" : "Create item"}
            </Button>
          </form>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Your items</h3>
                <p className="mt-1 text-xs text-slate-500">{items.length} item{items.length === 1 ? "" : "s"} visible to this user</p>
              </div>
              <Button onClick={loadItems} type="button" variant="outline">Refresh</Button>
            </div>

            {error ? (
              <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="m-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            {items.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-medium text-slate-700">No items yet.</p>
                <p className="mt-1 text-xs text-slate-500">Create the first one to prove authenticated insert/select.</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {items.map((item) => (
                  <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between" key={item.id}>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                      {item.notes ? <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{item.notes}</p> : null}
                      <p className="mt-2 text-[11px] text-slate-400">
                        Created {new Date(item.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button className="gap-1" onClick={() => startEdit(item)} type="button" variant="outline">
                        <Pencil className="size-3.5" /> Edit
                      </Button>
                      <Button className="gap-1 text-red-600 hover:text-red-700" onClick={() => deleteItem(item)} type="button" variant="outline">
                        <Trash2 className="size-3.5" /> Delete
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
