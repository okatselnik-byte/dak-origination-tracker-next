"use client";

import { BarChart3, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/");
        return;
      }

      setUser(data.session.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/");
      else setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (loading) {
    return <div className="p-6 text-center text-sm text-slate-400">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-56 flex-col border-r border-slate-200 bg-white">
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
          <button className="flex w-full items-center gap-2.5 rounded-lg bg-[#1B2A4A] px-3 py-2 text-[13px] font-medium text-white">
            <BarChart3 className="size-4" /> Dashboard
          </button>
          <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
            <UserRound className="size-4" /> Account
          </button>
        </nav>

        <div className="border-t border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-slate-400">Authenticated</span>
          </div>
        </div>
      </aside>

      <main className="ml-56 min-h-screen p-6">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Protected Dashboard</h2>
            <p className="mt-0.5 text-[13px] text-slate-500">
              You are signed in with Supabase Auth.
            </p>
          </div>
          <Button className="gap-2" onClick={logout} variant="outline">
            <LogOut className="size-4" /> Logout
          </Button>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <ShieldCheck className="size-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Session active</h3>
            <p className="mt-1 text-[13px] text-slate-500">This route redirects unauthenticated users.</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
            <h3 className="text-sm font-semibold text-slate-900">Current user</h3>
            <dl className="mt-4 grid gap-3 text-[13px]">
              <div className="grid gap-1 sm:grid-cols-[120px_1fr] sm:gap-3">
                <dt className="font-medium text-slate-500">Email</dt>
                <dd className="text-slate-900">{user?.email}</dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[120px_1fr] sm:gap-3">
                <dt className="font-medium text-slate-500">User ID</dt>
                <dd className="break-all text-slate-900">{user?.id}</dd>
              </div>
              <div className="grid gap-1 sm:grid-cols-[120px_1fr] sm:gap-3">
                <dt className="font-medium text-slate-500">Last sign in</dt>
                <dd className="text-slate-900">{user?.last_sign_in_at || "—"}</dd>
              </div>
            </dl>
          </div>
        </section>
      </main>
    </div>
  );
}
