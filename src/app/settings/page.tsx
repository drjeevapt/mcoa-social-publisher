'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import {
  User,
  Building,
  Clock,
  Bell,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Save,
} from 'lucide-react';

export default function SettingsPage() {
  const [diagnostics, setDiagnostics] = useState<any | null>(null);
  const [loadingDiag, setLoadingDiag] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Settings form states
  const [adminName, setAdminName] = useState('Academy Administrator');
  const [adminEmail, setAdminEmail] = useState('admin@medicalcodingofficers.com');
  const [workspaceName, setWorkspaceName] = useState('Medical Coding Officers Academy');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const fetchDiagnostics = async () => {
    try {
      setLoadingDiag(true);
      const res = await fetch('/api/diagnostics');
      const data = await res.json();
      setDiagnostics(data.diagnostics);
    } catch (e) {
      console.error('Error fetching diagnostics:', e);
    } finally {
      setLoadingDiag(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <AppShell title="System Settings & Academy Preferences">
      {savedSuccess && (
        <Alert type="success" title="Settings Saved">
          Workspace details and notification preferences updated successfully.
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Settings Forms (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* Workspace Details */}
            <Card className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border text-white">
                <Building className="w-4 h-4 text-gold-400" />
                <h3 className="font-semibold text-sm">Workspace Information</h3>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">Workspace Name</label>
                  <input
                    type="text"
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full mt-1 bg-surface border border-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Default Timezone</label>
                  <div className="mt-1 flex items-center gap-2 p-2.5 bg-surface border border-border rounded-lg text-sm text-zinc-200">
                    <Clock className="w-4 h-4 text-gold-400 shrink-0" />
                    <span>{timezone} (India Standard Time, UTC+05:30)</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Calibrated for all scheduling and analytics workflows across India.
                  </p>
                </div>
              </div>
            </Card>

            {/* Admin Profile */}
            <Card className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border text-white">
                <User className="w-4 h-4 text-gold-400" />
                <h3 className="font-semibold text-sm">Administrator Profile</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300">Full Name</label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full mt-1 bg-surface border border-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300">Contact Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full mt-1 bg-surface border border-border rounded-lg p-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-gold-400/50"
                  />
                </div>
              </div>
            </Card>

            {/* Notifications */}
            <Card className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-border text-white">
                <Bell className="w-4 h-4 text-gold-400" />
                <h3 className="font-semibold text-sm">Notification Preferences</h3>
              </div>

              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailAlerts}
                    onChange={(e) => setEmailAlerts(e.target.checked)}
                    className="mt-1 rounded bg-surface border-border text-gold-500 focus:ring-gold-400"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white">
                      Instant Email Alert on Failed Posts
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Sends an alert when an automated post fails so you can retry the destination immediately.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={weeklyDigest}
                    onChange={(e) => setWeeklyDigest(e.target.checked)}
                    className="mt-1 rounded bg-surface border-border text-gold-500 focus:ring-gold-400"
                  />
                  <div>
                    <span className="text-xs font-semibold text-white">
                      Weekly Performance & Publishing Digest
                    </span>
                    <p className="text-[11px] text-zinc-400">
                      Summary of scheduled vs published posts delivered every Monday at 9:00 AM IST.
                    </p>
                  </div>
                </label>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" leftIcon={<Save className="w-4 h-4" />}>
                Save Preferences
              </Button>
            </div>
          </form>
        </div>

        {/* Diagnostics & API Health (5 cols) */}
        <div id="diagnostics" className="lg:col-span-5 space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-white">
                <ShieldCheck className="w-4 h-4 text-gold-400" />
                <h3 className="font-semibold text-sm">Platform API Readiness</h3>
              </div>
              <button
                onClick={fetchDiagnostics}
                className="p-1 rounded text-zinc-400 hover:text-white"
                title="Refresh diagnostics"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loadingDiag ? (
              <div className="py-6 text-center text-xs text-zinc-500">Checking environment...</div>
            ) : diagnostics ? (
              <div className="space-y-4 text-xs">
                {/* Supabase Status */}
                <div className="p-3 bg-surface rounded-xl border border-border space-y-2">
                  <div className="font-semibold text-white">Supabase Infrastructure</div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Supabase URL</span>
                      {diagnostics.supabase.urlConfigured ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Configured
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Placeholder
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Service Role Key</span>
                      {diagnostics.supabase.serviceRoleKeyConfigured ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Configured
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Placeholder
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Token Security */}
                <div className="p-3 bg-surface rounded-xl border border-border space-y-2">
                  <div className="font-semibold text-white">Encryption & Security</div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">AES-256-GCM Key</span>
                      {diagnostics.security.encryptionKeyConfigured ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Production Key Set
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Dev Key Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Meta Graph API */}
                <div className="p-3 bg-surface rounded-xl border border-border space-y-2">
                  <div className="font-semibold text-white">Meta Developer App (Facebook / IG)</div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Meta App ID & Secret</span>
                      {diagnostics.meta.readyForOAuth ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready for OAuth
                        </span>
                      ) : (
                        <span className="text-zinc-500 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Setup Needed in .env
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Google Business Profile */}
                <div className="p-3 bg-surface rounded-xl border border-border space-y-2">
                  <div className="font-semibold text-white">Google Business Profile</div>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Live Publishing Gate</span>
                      <Badge variant={diagnostics.google.livePublishingApproved ? 'green' : 'amber'}>
                        {diagnostics.google.livePublishingApproved ? 'Approved' : 'Guarded / Disabled'}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-zinc-500 pt-1">
                      {diagnostics.google.approvalStatus}
                    </p>
                  </div>
                </div>

                {/* Background Worker */}
                <div className="p-3 bg-surface rounded-xl border border-border space-y-1 text-[11px]">
                  <div className="font-semibold text-white">Scheduled Worker</div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Timezone</span>
                    <span className="text-gold-300 font-mono">Asia/Kolkata</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Daemon Script</span>
                    <span className="text-zinc-300 font-mono">npm run worker</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-rose-400">Failed to load diagnostics.</div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
