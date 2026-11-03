import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { ArrowRight, BookOpen, GraduationCap, Loader2 } from "lucide-react";
import logo from "@/assets/images.png";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — GU Tech LMS" },
      { name: "description", content: "Sign in to the GU Tech learning management system." },
      { property: "og:title", content: "Sign in — GU Tech LMS" },
      {
        property: "og:description",
        content: "Access your GU Tech courses, classes and administration tools.",
      },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password is required"),
});

function AuthPage() {
  const navigate = useNavigate();
  const [err, setErr] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = form.handleSubmit(async (v) => {
    setErr(null);
    const { error } = await supabase.auth.signInWithPassword(v);
    if (error) {
      setErr(
        error.message.includes("banned") ? "This account has been deactivated." : error.message,
      );
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  });

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-hero p-12 text-primary-foreground lg:flex xl:p-16">
        <div
          aria-hidden="true"
          className="absolute -bottom-40 -right-32 h-[34rem] w-[34rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -right-16 h-[27rem] w-[27rem] rounded-full border border-white/10"
        />
        <div className="relative">
          <img
            src={logo}
            alt="GU Tech — Ghazali University School of Technology"
            className="h-20 w-28 rounded-md object-cover object-center"
          />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-foreground/55">
            Student & faculty portal
          </p>
        </div>
        <div className="relative max-w-xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
            Learning Management System
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Your learning.
            <br />
            All in one place.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-primary-foreground/70">
            A connected campus for course resources, assessments, classroom updates, and the people
            who make learning happen.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-xs font-medium text-primary-foreground/80">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2">
              <BookOpen className="h-3.5 w-3.5 text-gold" /> Course spaces
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2">
              <GraduationCap className="h-3.5 w-3.5 text-gold" /> Academic progress
            </span>
          </div>
        </div>
        <p className="relative text-xs text-primary-foreground/45">
          Ghazali University School of Technology
        </p>
      </section>

      <div className="flex min-h-screen flex-col">
        <header className="flex items-center gap-3 border-b bg-card px-5 py-3 lg:hidden">
          <img src={logo} alt="GU Tech" className="h-10 w-14 rounded object-cover object-center" />
          <div>
            <p className="text-sm font-bold">GU Tech</p>
            <p className="text-[11px] text-muted-foreground">Learning Management System</p>
          </div>
        </header>
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <form onSubmit={onSubmit} className="w-full max-w-[390px] space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                Welcome to GU Tech
              </p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">Sign in to your account</h2>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">
                Enter the credentials provided by your university administrator.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">University email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-11 bg-card"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <span className="text-[11px] text-muted-foreground">
                  Contact your administrator for help
                </span>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                className="h-11 bg-card"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            {err && (
              <p
                role="alert"
                className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
              >
                {err}
              </p>
            )}
            <Button type="submit" className="h-11 w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            <div className="border-t pt-5 text-center">
              <p className="text-xs leading-5 text-muted-foreground">
                Accounts are issued by GU Tech administration.
                <br />
                If you need access, please contact your administrator.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
