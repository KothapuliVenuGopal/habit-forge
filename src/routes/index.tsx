import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Shield, Trophy, Sparkles, Zap, Flame, Brain } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ConsiTrack — Turn Daily Discipline Into Real Rewards" },
      {
        name: "description",
        content:
          "AI-verified habit tracking that turns daily discipline into streaks, credits, shields, and career rewards.",
      },
      { property: "og:title", content: "ConsiTrack — Turn Daily Discipline Into Real Rewards" },
      {
        property: "og:description",
        content: "AI-verified habits, streak shields, badges, and a career-focused reward economy.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-glow">
              <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight">ConsiTrack</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/auth"
              className="rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
            >
              Sign in
            </Link>
            <Link
              to="/auth"
              className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-medium text-white shadow-card transition-all hover:opacity-90"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, oklch(0.62 0.22 296 / 0.18), transparent 70%), radial-gradient(50% 40% at 80% 40%, oklch(0.72 0.14 215 / 0.15), transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-muted-foreground shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-highlight" />
            AI-verified habit tracking
          </span>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground sm:text-6xl">
            Turn daily discipline into
            <span className="block text-gradient-brand">real rewards.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Build habits that actually stick. AI verifies your effort, streaks earn credits, shields
            protect your progress, and your discipline unlocks career rewards.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-brand px-6 py-3 text-sm font-semibold text-white shadow-elevated transition-all hover:opacity-90"
            >
              Start free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center rounded-lg border border-border bg-white px-6 py-3 text-sm font-semibold text-foreground shadow-soft hover:bg-accent"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Brain,
              title: "AI verification",
              desc: "Every check-in is judged by AI. No fluff, no fake streaks — only real effort counts.",
              grad: "bg-gradient-brand",
            },
            {
              icon: Flame,
              title: "Streaks that mean it",
              desc: "GitHub-style contribution heatmap. Bonus credits at 7, 30, and 100 days.",
              grad: "bg-gradient-fire",
            },
            {
              icon: Zap,
              title: "Category credits",
              desc: "Earn Coding, Reading, Gym credits and spend them in the right marketplace.",
              grad: "bg-gradient-success",
            },
            {
              icon: Shield,
              title: "Streak shields",
              desc: "Bronze, Silver, and Gold shields protect missed days when life happens.",
              grad: "bg-gradient-warning",
            },
            {
              icon: Trophy,
              title: "Badges & rarity",
              desc: "Common to Legendary achievements with glowing visuals and progress tracking.",
              grad: "bg-gradient-brand",
            },
            {
              icon: Sparkles,
              title: "Career rewards",
              desc: "Cash in credits for resume builders, portfolio tools, and ATS optimizers.",
              grad: "bg-gradient-brand",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-gradient-card p-6 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated"
            >
              <div
                className={`mb-4 grid h-11 w-11 place-items-center rounded-xl ${f.grad} shadow-glow`}
              >
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-10 text-center shadow-elevated sm:p-16">
          <div
            aria-hidden
            className="absolute inset-0 opacity-30"
            style={{ background: "radial-gradient(60% 50% at 50% 0%, white, transparent 70%)" }}
          />
          <h2 className="relative text-3xl font-bold text-white sm:text-4xl">
            Discipline pays. Literally.
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-white/85">
            Join ConsiTrack and turn your habits into a compounding reward engine.
          </p>
          <Link
            to="/auth"
            className="relative mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary shadow-card transition-transform hover:scale-[1.02]"
          >
            Create your account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} ConsiTrack</p>
          <div className="flex gap-5">
            <Link to="/terms">Terms</Link>
            <Link to="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
