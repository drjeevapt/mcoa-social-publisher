import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { encryptToken } from '@/lib/crypto';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // workspaceId
  const errorParam = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const workspaceId = state || 'a0000000-0000-0000-0000-000000000001';

  if (errorParam || !code) {
    return NextResponse.redirect(`${appUrl}/accounts?error=${encodeURIComponent(errorParam || 'Google authorization code missing')}`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${appUrl}/accounts?error=${encodeURIComponent('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not configured on the server')}`
    );
  }

  try {
    const redirectUri = `${appUrl}/api/auth/callback/google`;

    // 1. Exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || 'Failed to exchange Google OAuth code');
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 2. Fetch Google user profile
    const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await userinfoRes.json();

    // 3. Encrypt access & refresh tokens
    const encAccess = encryptToken(accessToken);
    let encRefresh = null;
    if (refreshToken) {
      encRefresh = encryptToken(refreshToken);
    }

    const supabase = createAdminClient();

    // 4. Upsert connected_accounts
    const { data: account, error: accErr } = await (supabase
      .from('connected_accounts') as any)
      .upsert(
        {
          workspace_id: workspaceId,
          platform: 'google',
          platform_account_id: profile.id,
          account_name: profile.name || profile.email || 'Google Business Account',
          account_email: profile.email || null,
          profile_picture_url: profile.picture || null,
          encrypted_access_token: encAccess.encryptedText,
          token_iv: encAccess.iv,
          token_auth_tag: encAccess.authTag,
          encrypted_refresh_token: encRefresh ? encRefresh.encryptedText : null,
          refresh_token_iv: encRefresh ? encRefresh.iv : null,
          refresh_token_auth_tag: encRefresh ? encRefresh.authTag : null,
          token_expires_at: expiresAt,
          status: 'pending_approval',
          status_message: 'Connected. Live publishing disabled awaiting Google Cloud Project Business Profile API approval.',
          scopes: ['https://www.googleapis.com/auth/business.manage', 'email', 'profile'],
          metadata: {
            isLivePublishingApproved: false,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id,platform,platform_account_id' }
      )
      .select()
      .single();

    if (accErr || !account) {
      throw new Error(`Failed to store Google account: ${accErr?.message}`);
    }

    // 5. Store Google Business Profile Location destination with requires_approval = true
    await (supabase
      .from('connected_destinations') as any)
      .upsert(
        {
          workspace_id: workspaceId,
          connected_account_id: account.id,
          platform: 'google_business',
          destination_type: 'google_location',
          destination_name: 'Medical Coding Officers Academy (Location)',
          platform_destination_id: `accounts/${profile.id}/locations/mcoa-main`,
          is_enabled: false, // Disabled until approved!
          requires_approval: true,
          approval_status: 'pending_api_access',
          metadata: {
            note: 'Live posting disabled until Google Cloud Project API access is approved',
            accountEmail: profile.email,
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id,platform,platform_destination_id' }
      );

    // 6. Audit log
    await (supabase.from('audit_logs') as any).insert({
      workspace_id: workspaceId,
      action: 'account.connected',
      resource_type: 'connected_account',
      resource_id: account.id,
      metadata: {
        platform: 'google',
        accountEmail: profile.email,
        status: 'pending_approval',
      },
    });

    return NextResponse.redirect(`${appUrl}/accounts?success=google_connected`);
  } catch (err: any) {
    console.error('[Google OAuth Error]:', err);
    return NextResponse.redirect(`${appUrl}/accounts?error=${encodeURIComponent(err.message || 'Google OAuth failed')}`);
  }
}
