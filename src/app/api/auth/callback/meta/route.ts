import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { encryptToken } from '@/lib/crypto';

const GRAPH_BASE = 'https://graph.facebook.com/v21.0';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // workspaceId
  const errorParam = searchParams.get('error_message') || searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const workspaceId = state || 'a0000000-0000-0000-0000-000000000001';

  if (errorParam || !code) {
    return NextResponse.redirect(`${appUrl}/accounts?error=${encodeURIComponent(errorParam || 'OAuth code missing')}`);
  }

  const clientId = process.env.META_APP_ID;
  const clientSecret = process.env.META_APP_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(
      `${appUrl}/accounts?error=${encodeURIComponent('META_APP_ID or META_APP_SECRET is not configured on the server')}`
    );
  }

  try {
    const redirectUri = `${appUrl}/api/auth/callback/meta`;

    // 1. Exchange authorization code for short-lived access token
    const tokenUrl = `${GRAPH_BASE}/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error?.message || 'Failed to exchange authorization code for access token');
    }

    const shortLivedToken = tokenData.access_token;

    // 2. Exchange short-lived token for long-lived user access token (valid ~60 days)
    const longLivedUrl = `${GRAPH_BASE}/oauth/access_token?grant_type=fb_exchange_token&client_id=${clientId}&client_secret=${clientSecret}&fb_exchange_token=${shortLivedToken}`;
    const longLivedRes = await fetch(longLivedUrl);
    const longLivedData = await longLivedRes.json();

    const longLivedToken = longLivedData.access_token || shortLivedToken;
    const expiresInSeconds = longLivedData.expires_in || 5184000; // ~60 days
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    // 3. Fetch user profile
    const meRes = await fetch(`${GRAPH_BASE}/me?fields=id,name,email,picture&access_token=${longLivedToken}`);
    const meData = await meRes.json();

    // 4. Encrypt user token
    const encToken = encryptToken(longLivedToken);

    const supabase = createAdminClient();

    // 5. Upsert connected_accounts
    const { data: account, error: accErr } = await (supabase
      .from('connected_accounts') as any)
      .upsert(
        {
          workspace_id: workspaceId,
          platform: 'meta',
          platform_account_id: meData.id,
          account_name: meData.name || 'Meta Account',
          account_email: meData.email || null,
          profile_picture_url: meData.picture?.data?.url || null,
          encrypted_access_token: encToken.encryptedText,
          token_iv: encToken.iv,
          token_auth_tag: encToken.authTag,
          token_expires_at: expiresAt,
          status: 'active',
          status_message: 'Connected via Meta OAuth',
          scopes: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'instagram_basic', 'instagram_content_publish'],
          metadata: {
            tokenType: 'long_lived_user_token',
          },
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'workspace_id,platform,platform_account_id' }
      )
      .select()
      .single();

    if (accErr || !account) {
      throw new Error(`Failed to store Meta account: ${accErr?.message}`);
    }

    // 6. Fetch authorized Facebook Pages and linked Instagram Professional accounts
    const accountsRes = await fetch(
      `${GRAPH_BASE}/me/accounts?fields=id,name,access_token,category,instagram_business_account{id,username,name,profile_picture_url}&access_token=${longLivedToken}`
    );
    const pagesData = await accountsRes.json();

    if (pagesData.data && Array.isArray(pagesData.data)) {
      for (const page of pagesData.data) {
        // Encrypt page-specific access token
        const pageEnc = page.access_token ? encryptToken(page.access_token) : encToken;

        // Upsert Facebook Page destination
        await (supabase
          .from('connected_destinations') as any)
          .upsert(
            {
              workspace_id: workspaceId,
              connected_account_id: account.id,
              platform: 'facebook',
              destination_type: 'facebook_page',
              destination_name: page.name,
              platform_destination_id: page.id,
              encrypted_destination_token: pageEnc.encryptedText,
              destination_token_iv: pageEnc.iv,
              destination_token_auth_tag: pageEnc.authTag,
              is_enabled: true,
              requires_approval: false,
              approval_status: 'approved',
              metadata: { category: page.category },
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'workspace_id,platform,platform_destination_id' }
          );

        // If Page is linked to an Instagram Professional Account, upsert IG destination
        if (page.instagram_business_account) {
          const ig = page.instagram_business_account;
          await (supabase
            .from('connected_destinations') as any)
            .upsert(
              {
                workspace_id: workspaceId,
                connected_account_id: account.id,
                platform: 'instagram',
                destination_type: 'instagram_professional',
                destination_name: `@${ig.username || ig.name || 'instagram_account'}`,
                platform_destination_id: ig.id,
                // Instagram uses the linked Facebook Page access token
                encrypted_destination_token: pageEnc.encryptedText,
                destination_token_iv: pageEnc.iv,
                destination_token_auth_tag: pageEnc.authTag,
                is_enabled: true,
                requires_approval: false,
                approval_status: 'approved',
                metadata: {
                  username: ig.username,
                  linkedFacebookPageId: page.id,
                  linkedFacebookPageName: page.name,
                },
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'workspace_id,platform,platform_destination_id' }
            );
        }
      }
    }

    // 7. Audit log
    await (supabase.from('audit_logs') as any).insert({
      workspace_id: workspaceId,
      action: 'account.connected',
      resource_type: 'connected_account',
      resource_id: account.id,
      metadata: {
        platform: 'meta',
        userName: meData.name,
        pagesImported: pagesData.data?.length || 0,
      },
    });

    return NextResponse.redirect(`${appUrl}/accounts?success=meta_connected`);
  } catch (err: any) {
    console.error('[Meta OAuth Error]:', err);
    return NextResponse.redirect(`${appUrl}/accounts?error=${encodeURIComponent(err.message || 'Meta OAuth failed')}`);
  }
}
