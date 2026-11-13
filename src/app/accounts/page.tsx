'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import {
  Facebook,
  Instagram,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Trash2,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { formatInKolkata } from '@/lib/date-utils';

function AccountsContent() {
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [alertInfo, setAlertInfo] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check URL params for OAuth callbacks
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'meta_connected') {
      setAlertInfo({
        type: 'success',
        message: 'Meta account successfully connected! Facebook Pages and linked Instagram accounts imported.',
      });
    } else if (success === 'google_connected') {
      setAlertInfo({
        type: 'success',
        message: 'Google Account connected. Note: Location publishing remains pending Google API verification.',
      });
    } else if (error) {
      setAlertInfo({
        type: 'error',
        message: decodeURIComponent(error),
      });
    }
  }, [searchParams]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounts');
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleConnectMeta = () => {
    const metaAppId = process.env.NEXT_PUBLIC_META_APP_ID || '';
    if (!metaAppId) {
      alert(
        'Meta App ID is not configured in environment variables (META_APP_ID). Please configure your Meta Developer credentials.'
      );
      return;
    }

    const appUrl = window.location.origin;
    const redirectUri = `${appUrl}/api/auth/callback/meta`;
    const scopes = [
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_content_publish',
    ].join(',');

    const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${encodeURIComponent(scopes)}&state=a0000000-0000-0000-0000-000000000001`;

    window.location.href = oauthUrl;
  };

  const handleConnectGoogle = () => {
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    if (!googleClientId) {
      alert(
        'Google Client ID is not configured in environment variables (GOOGLE_CLIENT_ID). Please configure your Google Cloud credentials.'
      );
      return;
    }

    const appUrl = window.location.origin;
    const redirectUri = `${appUrl}/api/auth/callback/google`;
    const scopes = [
      'https://www.googleapis.com/auth/business.manage',
      'email',
      'profile',
    ].join(' ');

    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=code&scope=${encodeURIComponent(
      scopes
    )}&access_type=offline&prompt=consent&state=a0000000-0000-0000-0000-000000000001`;

    window.location.href = oauthUrl;
  };

  const handleToggleDestination = async (destinationId: string, currentEnabled: boolean) => {
    try {
      const res = await fetch('/api/destinations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinationId,
          isEnabled: !currentEnabled,
        }),
      });

      if (res.ok) {
        await fetchAccounts();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to toggle destination');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating destination');
    }
  };

  const handleDisconnect = async (accountId: string, accountName: string) => {
    if (
      !confirm(
        `Are you sure you want to disconnect ${accountName}? All stored credentials will be purged permanently.`
      )
    ) {
      return;
    }

    try {
      setDisconnectingId(accountId);
      const res = await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' });
      if (res.ok) {
        setAlertInfo({
          type: 'success',
          message: `${accountName} disconnected and stored OAuth tokens purged.`,
        });
        await fetchAccounts();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to disconnect');
      }
    } catch (err: any) {
      alert(err.message || 'Disconnect error');
    } finally {
      setDisconnectingId(null);
    }
  };

  const metaAccount = accounts.find((a) => a.platform === 'meta');
  const googleAccount = accounts.find((a) => a.platform === 'google');

  return (
    <div className="space-y-6">
      {alertInfo && (
        <Alert
          type={alertInfo.type}
          title={alertInfo.type === 'success' ? 'OAuth Notice' : 'Connection Error'}
        >
          {alertInfo.message}
        </Alert>
      )}

      {/* Security & Official OAuth Compliance Note */}
      <div className="p-4 rounded-xl bg-surface border border-gold-400/30 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-gold-400 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-300 space-y-1">
          <p className="font-semibold text-white">
            Security & Official OAuth Integration Standards
          </p>
          <p className="text-zinc-400 leading-relaxed">
            MCOA Social Publisher uses official Meta Graph API and Google Identity OAuth 2.0 flows. Your social passwords are never requested or stored. Access tokens are encrypted on the server with AES-256-GCM.
          </p>
        </div>
      </div>

      {/* Channel Connections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* META (FACEBOOK & INSTAGRAM) */}
        <Card className="space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                <Facebook className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">Meta Integration</h3>
                <p className="text-xs text-zinc-400">Facebook Pages & Instagram Professional</p>
              </div>
            </div>

            {metaAccount ? (
              <Badge variant="green" dot>
                Connected
              </Badge>
            ) : (
              <Badge variant="zinc">Not Connected</Badge>
            )}
          </div>

          <div className="text-xs text-zinc-300 space-y-2">
            <p>
              Connect your authorized Facebook Pages and linked Instagram Professional accounts using Meta Login.
            </p>
            <div className="text-[11px] text-zinc-500">
              Required permissions: <span className="font-mono text-zinc-400">pages_manage_posts, pages_read_engagement, instagram_content_publish</span>
            </div>
          </div>

          {metaAccount ? (
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-surface rounded-xl border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400">Signed in as:</span>
                  <h4 className="text-sm font-semibold text-white">{metaAccount.account_name}</h4>
                  <p className="text-[10px] text-zinc-500">
                    Expires: {metaAccount.token_expires_at ? formatInKolkata(metaAccount.token_expires_at) : 'Auto-renewing'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  isLoading={disconnectingId === metaAccount.id}
                  onClick={() => handleDisconnect(metaAccount.id, metaAccount.account_name)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Disconnect
                </Button>
              </div>

              {/* Authorized Destinations List */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Authorized Destinations
                </h4>
                {(metaAccount.connected_destinations || []).map((dest: any) => (
                  <div
                    key={dest.id}
                    className="p-3 rounded-lg bg-surface border border-border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      {dest.platform === 'facebook' ? (
                        <Facebook className="w-4 h-4 text-blue-400" />
                      ) : (
                        <Instagram className="w-4 h-4 text-pink-400" />
                      )}
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {dest.destination_name}
                        </div>
                        <div className="text-[10px] text-zinc-500 capitalize">
                          {dest.destination_type.replace('_', ' ')}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleDestination(dest.id, dest.is_enabled)}
                      className={`text-xs px-2.5 py-1 rounded-md font-medium border transition-colors ${
                        dest.is_enabled
                          ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/60'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'
                      }`}
                    >
                      {dest.is_enabled ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <Button
                variant="primary"
                onClick={handleConnectMeta}
                leftIcon={<Facebook className="w-4 h-4" />}
                className="w-full"
              >
                Connect Meta Account via OAuth
              </Button>
            </div>
          )}
        </Card>

        {/* GOOGLE BUSINESS PROFILE */}
        <Card className="space-y-4">
          <div className="flex items-start justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-base">Google Business Profile</h3>
                <p className="text-xs text-zinc-400">Academy Local Presence & Location Updates</p>
              </div>
            </div>

            {process.env.ENABLE_GOOGLE_BUSINESS_LIVE_PUBLISHING === 'true' ? (
              <Badge variant="green" dot>
                Live Enabled
              </Badge>
            ) : (
              <Badge variant="amber" dot>
                Approval Pending
              </Badge>
            )}
          </div>

          <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-xl space-y-1.5 text-xs text-amber-200">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <ShieldAlert className="w-4 h-4" />
              <span>Google Cloud API Approval Requirement</span>
            </div>
            <p className="text-amber-200/80 leading-relaxed text-[11px]">
              Per official Google policies, publishing to Google Business Profile locations requires your Google Cloud project to receive explicit API access. Live publishing remains safely disabled until access is granted.
            </p>
          </div>

          {googleAccount ? (
            <div className="space-y-3 pt-2">
              <div className="p-3 bg-surface rounded-xl border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-400">Connected Google Profile:</span>
                  <h4 className="text-sm font-semibold text-white">{googleAccount.account_name}</h4>
                  <p className="text-[10px] text-zinc-500">{googleAccount.account_email}</p>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  isLoading={disconnectingId === googleAccount.id}
                  onClick={() => handleDisconnect(googleAccount.id, googleAccount.account_name)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                >
                  Disconnect
                </Button>
              </div>

              {/* Locations */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Location Destinations
                </h4>
                {(googleAccount.connected_destinations || []).map((dest: any) => (
                  <div
                    key={dest.id}
                    className="p-3 rounded-lg bg-surface border border-border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {dest.destination_name}
                        </div>
                        <div className="text-[10px] text-amber-400">
                          {dest.approval_status === 'pending_api_access'
                            ? 'Awaiting Google API Approval'
                            : 'Approved'}
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] px-2 py-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Live Publishing Guarded
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <Button
                variant="outline"
                onClick={handleConnectGoogle}
                leftIcon={<MapPin className="w-4 h-4" />}
                className="w-full"
              >
                Connect Google Account (Pre-Approval OAuth)
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  return (
    <AppShell title="Connected Channel Management">
      <Suspense fallback={<div className="p-8 text-center text-zinc-500 text-xs">Loading channel connections...</div>}>
        <AccountsContent />
      </Suspense>
    </AppShell>
  );
}

