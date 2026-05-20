"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10 sm:px-6 lg:px-8">
      <section className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Mail className="size-5" />
          </div>
          <Badge className="mb-3 gap-1.5" variant="secondary">
            <CheckCircle2 className="size-3.5" /> Supabase Auth
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dak Origination</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your protected dashboard.</p>
        </div>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader>
            <CardTitle>{mode === "login" ? "Welcome back" : "Create account"}</CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Use your confirmed Supabase user to continue."
                : "Create a Supabase account. Email confirmation may be required."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="email">
                  Email
                </label>
                <Input id="email" placeholder="you@example.com" type="email" {...form.register("email")} />
                {form.formState.errors.email ? (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground" htmlFor="password">
                  Password
                </label>
                <Input id="password" placeholder="••••••••" type="password" {...form.register("password")} />
                {form.formState.errors.password ? (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                ) : null}
              </div>

              {status ? (
                <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{status}</div>
              ) : null}

              <Button className="h-10 w-full gap-2" disabled={isSubmitting} type="submit">
                {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                {isSubmitting ? "Working..." : mode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <Separator className="my-5" />

            <Button
              className="w-full"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setStatus(null);
                form.clearErrors();
              }}
              type="button"
              variant="ghost"
            >
              {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
