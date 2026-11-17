"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { loginAction, type AuthFormState } from "@/app/(auth)/actions";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<
    AuthFormState,
    FormData
  >(loginAction, null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = form.handleSubmit((data) => {
    const fd = new FormData();
    fd.set("email", data.email);
    fd.set("password", data.password);
    formAction(fd);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Masuk</CardTitle>
        <CardDescription>
          Belum punya akun?{" "}
          <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Daftar di sini
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          {state?.error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="nama@email.com"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-sm text-destructive">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {pending ? "Memproses…" : "Masuk"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
