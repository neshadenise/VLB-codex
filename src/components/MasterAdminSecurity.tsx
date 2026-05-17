import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Crown, Key, Mail, RefreshCw, Shield, Copy, ScrollText, ArrowRightLeft, Trash2 } from "lucide-react";
import {
  amIMasterAdmin,
} from "@/lib/admin.functions";
import {
  getMasterRecoveryEmail,
  setMasterRecoveryEmail,
  generateMasterRecoveryCodes,
  revokeMasterRecoveryCodes,
  getMasterRecoveryCodesMeta,
  transferMasterAdmin,
  listAdminSecurityEvents,
} from "@/lib/master-admin.functions";

type EventRow = {
  id: string;
  actor_email: string | null;
  action: string;
  target_email: string | null;
  success: boolean;
  ip: string | null;
  user_agent: string | null;
  metadata: any;
  created_at: string;
};

export function MasterAdminSecurity() {
  const checkMaster = useServerFn(amIMasterAdmin);
  const getEmail = useServerFn(getMasterRecoveryEmail);
  const setEmail = useServerFn(setMasterRecoveryEmail);
  const genCodes = useServerFn(generateMasterRecoveryCodes);
  const revokeCodes = useServerFn(revokeMasterRecoveryCodes);
  const codesMeta = useServerFn(getMasterRecoveryCodesMeta);
  const transfer = useServerFn(transferMasterAdmin);
  const listEvents = useServerFn(listAdminSecurityEvents);

  const [isMaster, setIsMaster] = useState(false);
  const [checked, setChecked] = useState(false);
  const [recovery, setRecovery] = useState("");
  const [savedRecovery, setSavedRecovery] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ total: number; active: number; used: number; last_generated: string | null }>({
    total: 0, active: 0, used: 0, last_generated: null,
  });
  const [newCodes, setNewCodes] = useState<string[] | null>(null);
  const [transferEmail, setTransferEmail] = useState("");
  const [transferConfirm, setTransferConfirm] = useState("");
  const [keepOld, setKeepOld] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [e, m, ev] = await Promise.all([getEmail(), codesMeta(), listEvents()]);
    setSavedRecovery((e as any)?.email ?? null);
    setRecovery((e as any)?.email ?? "");
    setMeta({
      total: (m as any)?.total ?? 0,
      active: (m as any)?.active ?? 0,
      used: (m as any)?.used ?? 0,
      last_generated: (m as any)?.last_generated ?? null,
    });
    setEvents(((ev as any)?.events ?? []) as EventRow[]);
  }, [getEmail, codesMeta, listEvents]);

  useEffect(() => {
    (async () => {
      try {
        const r: any = await checkMaster();
        const master = !!r?.isMaster;
        setIsMaster(master);
        if (master) await refresh();
      } finally { setChecked(true); }
    })();
  }, [checkMaster, refresh]);

  if (!checked || !isMaster) return null;

  const onSaveEmail = async () => {
    setBusy(true);
    try {
      const r: any = await setEmail({ data: { email: recovery.trim() } });
      if (r?.error) toast.error(r.error);
      else { toast.success("Recovery email saved"); await refresh(); }
    } finally { setBusy(false); }
  };

  const onGenerate = async () => {
    if (meta.active > 0 && !confirm("Generating new codes will revoke all existing active codes. Continue?")) return;
    setBusy(true);
    try {
      const r: any = await genCodes({ data: { count: 8 } });
      if (r?.error) toast.error(r.error);
      else {
        setNewCodes(r.codes as string[]);
        toast.success("New recovery codes generated — save them now");
        await refresh();
      }
    } finally { setBusy(false); }
  };

  const onRevoke = async () => {
    if (!confirm("Revoke all active recovery codes?")) return;
    setBusy(true);
    try {
      const r: any = await revokeCodes();
      if (r?.error) toast.error(r.error);
      else { toast.success(`Revoked ${r.revoked} code(s)`); setNewCodes(null); await refresh(); }
    } finally { setBusy(false); }
  };

  const onTransfer = async () => {
    setBusy(true);
    try {
      const r: any = await transfer({ data: {
        email: transferEmail.trim(),
        confirm: transferConfirm,
        keepOldAsAdmin: keepOld,
      } });
      if (r?.error) {
        const msg = String(r.error);
        if (msg.includes("BAD_CONFIRMATION")) toast.error("Type the exact phrase: TRANSFER MASTER ADMIN");
        else if (msg.includes("USER_NOT_FOUND")) toast.error("That account hasn't signed up yet.");
        else toast.error(msg);
      } else {
        toast.success(`Master admin transferred to ${transferEmail}`);
        setTransferEmail(""); setTransferConfirm("");
        await refresh();
      }
    } finally { setBusy(false); }
  };

  const copyCodes = async () => {
    if (!newCodes) return;
    await navigator.clipboard.writeText(newCodes.join("\n"));
    toast.success("Copied to clipboard");
  };

  return (
    <div className="glass rounded-3xl p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5 text-primary" />
        <h2 className="font-display text-2xl">Master admin security</h2>
      </div>
      <p className="text-sm text-muted-foreground -mt-3">
        Backup recovery for your master account. Keep these codes safe — anyone with a code and your recovery email can transfer master access.
      </p>

      {/* Recovery email */}
      <section className="space-y-2">
        <Label className="flex items-center gap-2"><Mail className="h-4 w-4" /> Recovery email</Label>
        <div className="flex gap-2 flex-wrap">
          <Input
            type="email"
            placeholder="recovery@example.com"
            value={recovery}
            onChange={(e) => setRecovery(e.target.value)}
            className="flex-1 min-w-[220px]"
            disabled={busy}
          />
          <Button onClick={onSaveEmail} disabled={busy || !recovery.trim() || recovery.trim() === savedRecovery}>
            Save
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Used only for emergency recovery verification. It does <strong>not</strong> grant admin access by itself.
        </p>
      </section>

      {/* Recovery codes */}
      <section className="space-y-2">
        <Label className="flex items-center gap-2"><Key className="h-4 w-4" /> Emergency recovery codes</Label>
        <div className="text-sm text-muted-foreground">
          {meta.active} active · {meta.used} used · {meta.total} total
          {meta.last_generated && <> · last generated {new Date(meta.last_generated).toLocaleDateString()}</>}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={onGenerate} disabled={busy} className="bg-glow text-primary-foreground shadow-glow">
            <RefreshCw className="h-4 w-4 mr-1" /> {meta.active > 0 ? "Regenerate codes" : "Generate codes"}
          </Button>
          {meta.active > 0 && (
            <Button onClick={onRevoke} disabled={busy} variant="outline">
              <Trash2 className="h-4 w-4 mr-1" /> Revoke all
            </Button>
          )}
        </div>
        {newCodes && (
          <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4 mt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium">Save these codes — they won't be shown again</div>
              <Button size="sm" variant="outline" onClick={copyCodes}><Copy className="h-3.5 w-3.5 mr-1" /> Copy</Button>
            </div>
            <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
              {newCodes.map((c) => <li key={c} className="rounded-md bg-background/60 px-2 py-1">{c}</li>)}
            </ul>
          </div>
        )}
      </section>

      {/* Transfer */}
      <section className="space-y-2">
        <Label className="flex items-center gap-2"><ArrowRightLeft className="h-4 w-4" /> Transfer master admin</Label>
        <Input
          type="email"
          placeholder="new-master@example.com"
          value={transferEmail}
          onChange={(e) => setTransferEmail(e.target.value)}
          disabled={busy}
        />
        <Input
          placeholder='Type "TRANSFER MASTER ADMIN" to confirm'
          value={transferConfirm}
          onChange={(e) => setTransferConfirm(e.target.value)}
          disabled={busy}
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={keepOld} onChange={(e) => setKeepOld(e.target.checked)} />
          Keep my current account as a regular admin after transfer
        </label>
        <Button
          onClick={onTransfer}
          disabled={busy || !transferEmail.trim() || transferConfirm !== "TRANSFER MASTER ADMIN"}
          variant="destructive"
        >
          <Shield className="h-4 w-4 mr-1" /> Transfer master access
        </Button>
      </section>

      {/* Security events */}
      <section className="space-y-2">
        <Label className="flex items-center gap-2"><ScrollText className="h-4 w-4" /> Security event history</Label>
        <ul className="divide-y divide-border/60 rounded-2xl glass overflow-hidden max-h-80 overflow-y-auto">
          {events.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">No events yet.</li>}
          {events.map((e) => (
            <li key={e.id} className="px-4 py-2.5 text-xs flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-sm">
                  <span className={e.success ? "text-foreground" : "text-destructive"}>{e.action}</span>
                  {e.target_email && <span className="text-muted-foreground"> → {e.target_email}</span>}
                </div>
                <div className="text-muted-foreground truncate">
                  {e.actor_email ?? "system"} · {new Date(e.created_at).toLocaleString()}
                  {e.ip && <> · {e.ip}</>}
                </div>
              </div>
              {!e.success && <span className="text-[10px] uppercase tracking-widest text-destructive">failed</span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}