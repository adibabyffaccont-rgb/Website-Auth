import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus } from "lucide-react";

export default function Admin() {
  const { toast } = useToast();

  const [adminKey, setAdminKey] = useState("");
  const [isAuthed, setIsAuthed] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [createdPasswords, setCreatedPasswords] = useState<Record<string, string>>({});

  // Load users only after key is verified
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ["/api/admin/users", isAuthed, adminKey],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", {
        headers: { "x-admin-key": adminKey },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: isAuthed && !!adminKey,
  });

  const createUserMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        credentials: "include",
        body: JSON.stringify({ email: newEmail, password: newPassword, role: newRole }),
      });
      if (!res.ok) {
        const contentType = res.headers.get("content-type") || "";
        const text = await res.text();
        if (contentType.includes("application/json")) {
          try {
            const data = JSON.parse(text);
            throw new Error(data.message || `Failed: ${res.status}`);
          } catch {
            throw new Error(`Failed: ${res.status}`);
          }
        }
        throw new Error(text?.slice(0, 200) || `Failed: ${res.status}`);
      }
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) return res.json();
      return {};
    },
    onSuccess: () => {
      setIsCreateOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewRole("user");
      setCreatedPasswords(prev => ({ ...prev, [newEmail]: newPassword }));
      // refresh users list
      try { (window as any).__rq && (window as any).__rq.invalidate?.(); } catch {}
      toast({ title: "User created" });
    },
    onError: (e: any) => {
      toast({ title: "Error", description: e?.message || "Failed to create user", variant: "destructive" });
    },
  });

  const handleVerifyKey = async () => {
    try {
      setVerifying(true);
      const res = await fetch("/api/admin/users", {
        headers: { "x-admin-key": adminKey },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Invalid admin key");
      setIsAuthed(true);
      toast({ title: "Access granted" });
    } catch (e: any) {
      toast({ title: "Invalid key", description: e?.message || "Access denied", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-card/80 border border-border/40">
          <CardHeader className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-6 w-6 text-red-500" />
              <CardTitle>Admin Panel</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Enter the admin key to continue</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Admin key"
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
            />
            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={handleVerifyKey} disabled={verifying || !adminKey.trim()}>
              {verifying ? "Verifying…" : "Enter"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="bg-neutral-900/60 border-border/40"
              onClick={() => { window.location.href = "/"; }}
            >
              Home
            </Button>
            <Button
              variant="outline"
              className="bg-neutral-900/60 border-border/40"
              onClick={() => { window.location.href = "/"; }}
            >
              Log out
            </Button>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card text-foreground">
              <DialogHeader>
                <DialogTitle>Create User</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 mt-2">
                <Input placeholder="Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
                <Input placeholder="Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <select
                  className="h-10 rounded-md bg-background border border-border px-3 text-sm"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="owner">owner</option>
                  <option value="admin">admin</option>
                  <option value="staff">staff</option>
                  <option value="moderator">moderator</option>
                  <option value="user">user</option>
                </select>
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={() => createUserMutation.mutate()} disabled={createUserMutation.isPending || !newEmail || !newPassword}>
                  {createUserMutation.isPending ? "Creating…" : "Create User"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Users list */}
        <div className="mt-6">
          {isUsersLoading ? (
            <div className="text-sm text-muted-foreground">Loading users…</div>
          ) : Array.isArray(users) && users.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-border/40">
              <div className="grid grid-cols-3 text-xs uppercase tracking-wide bg-neutral-900/60 px-4 py-2">
                <div>Email</div>
                <div>Role / Password</div>
                <div>Status</div>
              </div>
              {users.map((u: any) => {
                const email = u.email || u.id;
                const pw = createdPasswords[email];
                return (
                  <div key={u.id} className="grid grid-cols-3 px-4 py-3 border-t border-border/30 text-sm">
                    <div className="truncate">{email}</div>
                    <div className="capitalize flex items-center gap-2">
                      <span>{u.role || 'user'}</span>
                      {pw && <span className="text-xs text-muted-foreground">/ {pw}</span>}
                    </div>
                    <div>{u.isActive === false ? 'inactive' : 'active'}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No users found</div>
          )}
        </div>
      </div>
    </div>
  );
}
