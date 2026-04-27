import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground relative overflow-hidden">
      {/* Gradient orb background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-[28rem] h-[28rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[24rem] h-[24rem] rounded-full bg-accent/15 blur-3xl" />
      </div>

      <main className="relative z-10 text-center space-y-10 px-6 max-w-2xl">
        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          CRM System Active
        </div>

        {/* Heading */}
        <div className="space-y-4">
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.1]">
            Property
            <span className="text-primary">CRM</span>
          </h1>
          <p className="text-muted-foreground text-lg sm:text-xl max-w-lg mx-auto leading-relaxed">
            Manage leads, track agents, and close deals&nbsp;&mdash; built for
            Pakistani property dealers.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            id="cta-signin"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 hover:brightness-110 transition-all duration-200 cursor-pointer"
          >
            Sign In
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/register"
            id="cta-register"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold text-base border border-border hover:bg-muted transition-all duration-200 cursor-pointer"
          >
            Create Account
          </Link>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {[
            "Lead Scoring",
            "WhatsApp Integration",
            "Real-Time Updates",
            "Analytics Dashboard",
          ].map((feature) => (
            <span
              key={feature}
              className="px-3 py-1 rounded-full bg-card border border-border text-sm text-muted-foreground"
            >
              {feature}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
