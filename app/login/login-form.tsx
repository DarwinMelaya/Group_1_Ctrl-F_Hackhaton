"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { signInSchema } from "@/lib/validation/auth";

type FieldErrors = Partial<Record<"email" | "password", string>>;

export function LoginForm({ next, initialError }: { next: string; initialError?: string }) {
  const router = useRouter();
  const [error, setError] = useState(initialError ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = new FormData(event.currentTarget);
    const parsed = signInSchema.safeParse({ email: form.get("email"), password: form.get("password") });
    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        errors[key] ??= issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setPending(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword(parsed.data);
    if (signInError || !data.user) {
      setPending(false);
      setError(
        signInError?.message === "Invalid login credentials"
          ? "Email or password is incorrect."
          : "Could not sign in. Check your connection and try again.",
      );
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      setPending(false);
      // Fishers and PICs use the MarAIne mobile app; this dashboard is for admins only.
      setError(
        profile?.role === "fisher" || profile?.role === "pic"
          ? "This is a fisher or PIC account. Please use the MarAIne mobile app. The dashboard is for admins only."
          : "This account does not have admin access. Ask an administrator to grant the admin role.",
      );
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
        />
        {fieldErrors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!fieldErrors.password}
          aria-describedby={fieldErrors.password ? "password-error" : undefined}
        />
        {fieldErrors.password && (
          <p id="password-error" className="text-sm text-destructive">
            {fieldErrors.password}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="mr-2 size-4 animate-spin" />}
        {pending ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
