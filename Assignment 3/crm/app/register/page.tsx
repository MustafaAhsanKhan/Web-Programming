import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md p-8 space-y-6 rounded-xl bg-card border border-border shadow-2xl shadow-black/20">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Create Account
          </h1>
          <p className="text-muted-foreground">
            Join PropertyCRM and start managing leads
          </p>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="register-name"
              className="block text-sm font-medium text-foreground"
            >
              Full Name
            </label>
            <input
              id="register-name"
              type="text"
              placeholder="Ahmed Khan"
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="register-email"
              className="block text-sm font-medium text-foreground"
            >
              Email
            </label>
            <input
              id="register-email"
              type="email"
              placeholder="ahmed@propertycrm.pk"
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="register-password"
              className="block text-sm font-medium text-foreground"
            >
              Password
            </label>
            <input
              id="register-password"
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="register-role"
              className="block text-sm font-medium text-foreground"
            >
              Role
            </label>
            <select
              id="register-role"
              className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
            >
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            id="register-submit"
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:brightness-110 shadow-lg shadow-primary/25 transition-all cursor-pointer"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary hover:underline font-medium"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
