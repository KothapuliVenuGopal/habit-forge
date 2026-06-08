import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions — ConsiTrack" }] }),
  component: Terms,
});

function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link to="/" className="text-sm text-primary hover:underline">← Back to home</Link>
      <h1 className="mt-4 text-4xl font-bold">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      <div className="prose prose-slate mt-8 max-w-none space-y-4 text-foreground">
        <h2 className="text-xl font-semibold">1. Acceptance</h2>
        <p>By creating an account on ConsiTrack you agree to these terms.</p>
        <h2 className="text-xl font-semibold">2. Habits & Verification</h2>
        <p>Check-ins are evaluated by AI. You agree not to game or fabricate evidence. Verified streaks, credits, shields, and badges are awarded at our discretion.</p>
        <h2 className="text-xl font-semibold">3. Bond Credits & Shields</h2>
        <p>Credits are category-specific and cannot be transferred. Shields activate immediately upon purchase and expire per the policy displayed. No refunds.</p>
        <h2 className="text-xl font-semibold">4. Community</h2>
        <p>Be kind. Harassment, spam, or fraudulent submissions may result in suspension.</p>
        <h2 className="text-xl font-semibold">5. Liability</h2>
        <p>The service is provided "as is" without warranty. We are not liable for loss of streaks, credits, or other in-app items.</p>
      </div>
    </div>
  );
}
