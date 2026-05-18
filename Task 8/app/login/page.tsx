import LoginForm from "@/app/login/LoginForm";

export default function LoginPage() {
  return (
    <section className="flex flex-1 items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </section>
  );
}
