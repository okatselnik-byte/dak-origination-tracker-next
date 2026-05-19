"use client";

import { Mail } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    async function completeAuth() {
      const code = searchParams.get("code");
      const error = searchParams.get("error_description") || searchParams.get("error");

      if (error) {
        setMessage(error);
        setTimeout(() => router.replace("/"), 1800);
        return;
      }

      if (!code) {
        setMessage("Missing auth code. Returning to login...");
        setTimeout(() => router.replace("/"), 1200);
        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        setMessage(exchangeError.message);
        setTimeout(() => router.replace("/"), 1800);
        return;
      }

      router.replace("/dashboard");
    }

    completeAuth();
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f1a2e] via-[#1B2A4A] to-[#2a3f6b] p-6">
      <section className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-sm">
          <Mail className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-white">Dak Origination</h1>
        <p className="mt-2 text-sm text-slate-300">{message}</p>
      </section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-sm text-slate-400">Completing sign in...</div>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
