"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const authSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthValues = z.infer<typeof authSchema>;
type AuthMode = "login" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [status, setStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/dashboard");
    });
  }, [router]);

  async function submit(values: AuthValues) {
    setIsSubmitting(true);
    setStatus(null);

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword(values)
        : await supabase.auth.signUp({
            ...values,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

    setIsSubmitting(false);

    if (result.error) {
      setStatus(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setStatus("Account created. Check your email to confirm signup, then log in.");
      setMode("login");
      return;
    }

    router.replace("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f1a2e] via-[#1B2A4A] to-[#2a3f6b] p-6">
      <section className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white backdrop-blur-sm">
            <Mail className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Dak Origination</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">Bravo Capital</p>
        </div>

        <form
          className="space-y-4 rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md"
          onSubmit={form.handleSubmit(submit)}
        >
          <div>
            <input
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-400 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/30"
              placeholder="Email address"
              type="email"
              {...form.register("email")}
            />
            {form.formState.errors.email ? (
              <p className="mt-1 text-xs text-red-300">{form.formState.errors.email.message}</p>
            ) : null}
          </div>

          <div>
            <input
              className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-400 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/30"
              placeholder="Password"
              type="password"
              {...form.register("password")}
            />
            {form.formState.errors.password ? (
              <p className="mt-1 text-xs text-red-300">{form.formState.errors.password.message}</p>
            ) : null}
          </div>

          {status ? (
            <div className="rounded-lg bg-white/10 px-3 py-2 text-xs text-slate-200">{status}</div>
          ) : null}

          <Button
            className="h-11 w-full rounded-xl bg-white text-sm font-semibold text-[#1B2A4A] hover:bg-slate-100"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Working..." : mode === "login" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <button
          className="mt-6 w-full text-center text-xs text-slate-400 hover:text-white"
          onClick={() => {
            setMode(mode === "login" ? "signup" : "login");
            setStatus(null);
            form.clearErrors();
          }}
          type="button"
        >
          {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
        </button>
      </section>
    </main>
  );
}
