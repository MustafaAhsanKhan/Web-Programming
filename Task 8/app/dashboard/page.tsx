import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { logout } from "@/app/actions/auth";
import SubmitButton from "@/app/components/SubmitButton";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userEmail = cookieStore.get("session_user")?.value;

  if (!userEmail) {
    redirect("/login");
  }

  return (
    <section className="flex flex-1 items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="rounded-lg bg-slate-100 px-3 py-2 text-slate-700">
          Logged in as <span className="font-semibold">{userEmail}</span>
        </p>

        <form action={logout}>
          <SubmitButton idleText="Logout" loadingText="Logging out..." />
        </form>
      </div>
    </section>
  );
}
