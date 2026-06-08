import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "Privacy Policy — ConsiTrack" }] }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link to="/" className="text-sm text-primary hover:underline">← Back to home</Link>
      <h1 className="mt-4 text-4xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      <div className="prose prose-slate mt-8 max-w-none space-y-4 text-foreground">
        <h2 className="text-xl font-semibold">Data we store</h2>
        <p>Your email, profile details, habits, check-ins (including text you submit for AI verification), and reward state.</p>
        <h2 className="text-xl font-semibold">AI processing</h2>
        <p>Check-in submissions are sent to our AI provider for verification only. We do not sell your data.</p>
        <h2 className="text-xl font-semibold">Your rights</h2>
        <p>You can update your profile or delete your account at any time from Settings.</p>
        <h2 className="text-xl font-semibold">Contact</h2>
        <p>Questions about privacy? Reach out via the project repository.</p>
      </div>
    </div>
  );
}
