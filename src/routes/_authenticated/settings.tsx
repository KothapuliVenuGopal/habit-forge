import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { myProfile, updateProfile } from "@/lib/profile.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — ConsiTrack" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const pFn = useServerFn(myProfile);
  const uFn = useServerFn(updateProfile);
  const profileQ = useQuery({ queryKey: ["profile"], queryFn: () => pFn() });

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (profileQ.data) {
      setDisplayName(profileQ.data.display_name ?? "");
      setUsername(profileQ.data.username ?? "");
      setBio(profileQ.data.bio ?? "");
    }
  }, [profileQ.data]);

  const mut = useMutation({
    mutationFn: () =>
      uFn({
        data: {
          display_name: displayName.trim() || undefined,
          username: username.trim() || undefined,
          bio: bio.trim() || undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-muted-foreground">Manage your profile and account.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
        className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-card"
      >
        <div className="space-y-2">
          <Label htmlFor="display_name">Display name</Label>
          <Input
            id="display_name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            minLength={3}
            maxLength={24}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
            rows={3}
          />
        </div>
        <Button
          type="submit"
          disabled={mut.isPending}
          className="bg-gradient-brand text-white hover:opacity-90"
        >
          {mut.isPending ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
        <h3 className="font-semibold text-destructive">Sign out</h3>
        <p className="mt-1 text-sm text-muted-foreground">End your session on this device.</p>
        <Button variant="outline" className="mt-3 border-destructive/40 text-destructive" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </AppShell>
  );
}
