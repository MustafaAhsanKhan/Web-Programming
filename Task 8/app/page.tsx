import Link from "next/link";

export default function Home() {
  return (
    <section className="flex flex-1 items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">Task 8 Authentication App</h1>
        <p className="mt-3 text-slate-600">
          Signup, login, cookie-based session handling, and a protected dashboard are configured in this project.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/signup"
            className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700"
          >
            Go to Signup
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800 transition hover:bg-slate-50"
          >
            Go to Login
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800 transition hover:bg-slate-50"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
