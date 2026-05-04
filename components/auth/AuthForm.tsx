"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { queueUserCreatedEmail } from "@/actions/auth.actions";
import { Button } from "@/components/ui/button";

type AuthMode = "sign-in" | "sign-up";

export default function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const isSignUp = mode === "sign-up";

  function handleSubmit(formData: FormData) {
    setError("");

    startTransition(async () => {
      const email = String(formData.get("email") || "");
      const password = String(formData.get("password") || "");

      if (isSignUp) {
        const firstName = String(formData.get("firstName") || "");
        const lastName = String(formData.get("lastName") || "");
        const name = `${firstName} ${lastName}`.trim();

        const signUpWithEmail = authClient.signUp.email as unknown as (input: {
          email: string;
          password: string;
          name: string;
          firstName: string;
          lastName: string;
        }) => ReturnType<typeof authClient.signUp.email>;

        const result = await signUpWithEmail({
          email,
          password,
          name,
          firstName,
          lastName,
        });

        if (result.error) {
          setError(result.error.message || "Could not create your account.");
          return;
        }

        if (result.data?.user) {
          await queueUserCreatedEmail({
            id: result.data.user.id,
            firstName,
            lastName,
            email,
          });
        }
      } else {
        const result = await authClient.signIn.email({
          email,
          password,
        });

        if (result.error) {
          setError(result.error.message || "Could not sign you in.");
          return;
        }
      }

      router.push("/");
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <p className="text-sm font-medium text-yellow-400">MarketPulse</p>
        <h1 className="mt-3 text-3xl font-semibold text-gray-100">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-gray-500">
          {isSignUp
            ? "Build a watchlist, open live chart pages, and receive useful market briefings."
            : "Sign in to continue tracking your market dashboard."}
        </p>
      </div>

      <form action={handleSubmit} className="space-y-4">
        {isSignUp ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="form-label">First name</span>
              <input className="form-input w-full" name="firstName" required minLength={2} />
            </label>
            <label className="space-y-2">
              <span className="form-label">Last name</span>
              <input className="form-input w-full" name="lastName" required minLength={2} />
            </label>
          </div>
        ) : null}

        <label className="block space-y-2">
          <span className="form-label">Email</span>
          <input className="form-input w-full" name="email" type="email" required />
        </label>

        <label className="block space-y-2">
          <span className="form-label">Password</span>
          <input className="form-input w-full" name="password" type="password" required minLength={8} />
        </label>

        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            <AlertCircle className="size-4" />
            {error}
          </div>
        ) : null}

        <Button className="yellow-btn w-full" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {isSignUp ? "Create account" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-gray-500">
        {isSignUp ? "Already have an account?" : "New to MarketPulse?"}{" "}
        <Link className="footer-link" href={isSignUp ? "/sign-in" : "/sign-up"}>
          {isSignUp ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
