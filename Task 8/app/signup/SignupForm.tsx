"use client";

import Link from "next/link";
import { useActionState } from "react";

import { signup, type AuthActionState } from "@/app/actions/auth";
import SubmitButton from "@/app/components/SubmitButton";

const initialState: AuthActionState = {};

export default function SignupForm() {
  const [state, formAction] = useActionState(signup, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Create Account</h1>

      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-slate-300 transition focus:ring"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-slate-300 transition focus:ring"
          placeholder="At least 6 characters"
        />
      </div>

      {state.error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <SubmitButton idleText="Sign Up" loadingText="Creating account..." />

      <p className="text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-slate-900 underline-offset-2 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}