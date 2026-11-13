import { NextResponse } from 'next/server';

export async function GET() {
  const isProd = process.env.NODE_ENV === 'production';

  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    supabase: {
      urlConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder'),
      anonKeyConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder'),
      serviceRoleKeyConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder'),
    },
    security: {
      encryptionKeyConfigured: !!process.env.ENCRYPTION_KEY,
      isDevFallbackActive: !process.env.ENCRYPTION_KEY && !isProd,
    },
    meta: {
      appIdConfigured: !!process.env.META_APP_ID,
      appSecretConfigured: !!process.env.META_APP_SECRET,
      readyForOAuth: !!process.env.META_APP_ID && !!process.env.META_APP_SECRET,
    },
    google: {
      clientIdConfigured: !!process.env.GOOGLE_CLIENT_ID,
      clientSecretConfigured: !!process.env.GOOGLE_CLIENT_SECRET,
      livePublishingApproved: process.env.ENABLE_GOOGLE_BUSINESS_LIVE_PUBLISHING === 'true',
      approvalStatus: process.env.ENABLE_GOOGLE_BUSINESS_LIVE_PUBLISHING === 'true'
        ? 'Live Publishing Enabled'
        : 'Live Publishing Disabled (Awaiting Google Cloud Project API Verification)',
    },
    backgroundWorker: {
      cronSecretConfigured: !!process.env.CRON_SECRET,
      timezone: 'Asia/Kolkata (IST, UTC+05:30)',
    },
  };

  return NextResponse.json({ diagnostics });
}
