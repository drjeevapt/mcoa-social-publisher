# MCOA Social Publisher

**Official Multi-Channel Social Media Publishing & Scheduling Platform for Medical Coding Officers Academy**

Built with Next.js (TypeScript), Supabase (PostgreSQL, Auth, Storage, RLS), Server-side AES-256-GCM token encryption, a durable background queue worker, and official Meta & Google APIs.

---

## Table of Contents

1. [Architecture & Security Overview](#architecture--security-overview)
2. [Step-by-Step Supabase Setup Instructions](#step-by-step-supabase-setup-instructions)
3. [Step-by-Step Meta App Setup Instructions](#step-by-step-meta-app-setup-instructions)
4. [Step-by-Step Google Cloud & GBP Setup Instructions](#step-by-step-google-cloud--gbp-setup-instructions)
5. [Required Permissions, Approvals & Credentials Matrix](#required-permissions-approvals--credentials-matrix)
6. [Local Development & Testing](#local-development--testing)
7. [Private Staging Deployment Guide](#private-staging-deployment-guide)
8. [Feature Status Matrix](#feature-status-matrix)

---

## 1. Architecture & Security Overview

- **Multi-Tenancy & Workspace Isolation**: The PostgreSQL schema is designed for multi-tenant scalability (workspaces, workspace members, RBAC roles: `owner`, `manager`, `creator`, `reviewer`), initially seeded and locked to the Medical Coding Officers Academy workspace.
- **PostgreSQL Row Level Security (RLS)**: Enforced across all tables (`workspaces`, `connected_accounts`, `connected_destinations`, `posts`, `post_destinations`, `audit_logs`).
- **Server-Side AES-256-GCM Token Encryption**: OAuth access tokens, page tokens, and refresh tokens are encrypted on the server before database storage with initialization vectors (IV) and authentication tags. Plaintext tokens are never returned to the client browser.
- **Durable Scheduling & Background Queue**: A standalone worker (`npm run worker` or HTTP cron `/api/cron/publish`) executes scheduled posts reliably in `Asia/Kolkata` (IST) timezone even when browsers are closed.
- **Granular Destination Tracking & Idempotency**: Each publishing destination (`facebook`, `instagram`, `google_business`) maintains independent state, error codes, and unique idempotency keys (`${postId}:${destinationId}:${timeBucket}`). Retrying failed destinations will **never** duplicate or re-post to channels that already succeeded.
- **Guarded Google Business Profile Live Publishing**: Live posting to Google Business Profile remains disabled (`ENABLE_GOOGLE_BUSINESS_LIVE_PUBLISHING=false`) until official Google Cloud project API verification is completed.

---

## 2. Step-by-Step Supabase Setup Instructions

### Step 2.1: Create Project & Database
1. Go to [Supabase](https://supabase.com) and create a new project named `mcoa-social-publisher`.
2. Select your region (e.g. **Mumbai, India [ap-south-1]** for lowest latency with `Asia/Kolkata`).
3. Set a strong database password and copy your project URL and keys.

### Step 2.2: Run Database Migrations
1. Open the Supabase Dashboard -> **SQL Editor**.
2. Run the initial schema migration from `supabase/migrations/20261113000001_initial_schema.sql`. This creates the multi-workspace tables, indexes, and Row Level Security policies.
3. Run the seed migration from `supabase/migrations/20261113000002_seed_mcoa_workspace.sql` to initialize the MCOA primary workspace.

### Step 2.3: Configure Supabase Storage
1. Navigate to **Storage** -> **Create a new bucket**.
2. Name the bucket `social-media-assets`.
3. Set the bucket to **Public** so Meta and Google image crawlers can fetch the creative URL.
4. Set allowed MIME types to: `image/jpeg, image/png, image/webp, image/gif`.
5. Set file size limit to `10MB`.

### Step 2.4: Copy API Credentials
1. Go to **Project Settings** -> **API**.
2. Copy `Project URL` to `NEXT_PUBLIC_SUPABASE_URL`.
3. Copy `anon public` key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Copy `service_role` key to `SUPABASE_SERVICE_ROLE_KEY` (keep strictly confidential).

---

## 3. Step-by-Step Meta App Setup Instructions

To publish to Facebook Pages and Instagram Professional accounts, you must use official Meta Graph APIs.

### Step 3.1: Create Meta Developer App
1. Visit the [Meta for Developers Portal](https://developers.facebook.com/).
2. Click **My Apps** -> **Create App**.
3. Select **Other** as the use case, then choose **Business** app type.
4. Set Display Name to `MCOA Social Publisher` and enter `admin@medicalcodingofficers.com`.

### Step 3.2: Add Products
1. Under Add Products, add **Facebook Login for Business**.
2. Under Settings -> Basic:
   - Copy **App ID** to `META_APP_ID` and `NEXT_PUBLIC_META_APP_ID`.
   - Copy **App Secret** to `META_APP_SECRET`.
   - Add your App Domain (e.g. `localhost` for testing, or your staging domain).
   - Add Privacy Policy URL and Terms of Service URL.

### Step 3.3: Configure OAuth Redirect URIs
1. In the left sidebar, click **Facebook Login for Business** -> **Settings**.
2. In **Valid OAuth Redirect URIs**, enter:
   - For local development: `http://localhost:3000/api/auth/callback/meta`
   - For staging/production: `https://your-staging-domain.com/api/auth/callback/meta`
3. Save changes.

### Step 3.4: Link Instagram Professional Account
1. Open the Facebook Page for Medical Coding Officers Academy.
2. Go to **Page Settings** -> **Linked Accounts** -> **Instagram**.
3. Connect your Instagram Professional (Business or Creator) account.

---

## 4. Step-by-Step Google Cloud & GBP Setup Instructions

### Step 4.1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project: `mcoa-social-publisher`.
3. Navigate to **APIs & Services** -> **OAuth consent screen**:
   - User Type: **External**.
   - App Name: `MCOA Social Publisher`.
   - User support email: `admin@medicalcodingofficers.com`.
   - Developer contact info: `admin@medicalcodingofficers.com`.
   - Scopes: Add `https://www.googleapis.com/auth/business.manage`, `email`, `profile`.

### Step 4.2: Create OAuth Credentials
1. Navigate to **APIs & Services** -> **Credentials** -> **Create Credentials** -> **OAuth client ID**.
2. Application type: **Web application**.
3. Name: `MCOA Social Publisher Web Client`.
4. Authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://your-staging-domain.com`
5. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://your-staging-domain.com/api/auth/callback/google`
6. Copy **Client ID** to `GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.
7. Copy **Client Secret** to `GOOGLE_CLIENT_SECRET`.

### Step 4.3: Request Google Business Profile API Access
1. Review the [Google Business Profile API Prerequisites](https://developers.google.com/my-business/content/prereqs).
2. Submit the Google Business Profile API access request form for your Google Cloud Project ID.
3. Until approval is received, keep `ENABLE_GOOGLE_BUSINESS_LIVE_PUBLISHING=false`. The application will cleanly allow connecting the account and drafting posts while explaining the approval status in the UI.

---

## 5. Required Permissions, Approvals & Credentials Matrix

| Provider | Requirement / Permission | Purpose | Status in Dev / Test | Production Launch Requirement |
| :--- | :--- | :--- | :--- | :--- |
| **Meta** | `pages_show_list` | Discover authorized Facebook Pages | Available immediately for App Admins / Testers | App Review required for public/unlisted users |
| **Meta** | `pages_read_engagement` | Verify Page status and duplicate check | Available immediately for App Admins / Testers | App Review required |
| **Meta** | `pages_manage_posts` | Publish photo updates to Facebook Page | Available immediately for App Admins / Testers | App Review required |
| **Meta** | `instagram_basic` | Read Instagram Professional profile details | Available immediately for App Admins / Testers | App Review required |
| **Meta** | `instagram_content_publish` | Create containers & publish IG photos | Available immediately for App Admins / Testers | App Review required |
| **Google** | `https://www.googleapis.com/auth/business.manage` | Manage Google Business Profile posts | OAuth consent screen test users | Google Cloud verification required |
| **Google** | My Business Account Management API | List business locations | Project API enablement | Google Partner / Business API Approval |

---

## 6. Local Development & Testing

### 6.1 Setup Environment
```bash
cp .env.example .env.local
# Generate a secure 32-byte encryption key:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Paste this key into ENCRYPTION_KEY in .env.local
```

### 6.2 Run Automated Tests
```bash
npm test
```
Runs 17 automated tests verifying AES-256-GCM token encryption, tampering protection, multi-channel validation (caption limits, hashtag limits, format & file size rules), Asia/Kolkata timezone calculations, and retry/duplicate prevention logic.

### 6.3 Run Next.js Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the MCOA Social Publisher dashboard.

### 6.4 Run Durable Background Worker
In a separate terminal:
```bash
npm run worker
```
The worker runs autonomously, polling every 30 seconds for scheduled posts due in Asia/Kolkata time, executing multi-destination dispatches, safe retries, and recording audit logs.

---

## 7. Private Staging Deployment Guide

### Deployment on Vercel / Node.js Host
1. **Frontend / Next.js**:
   - Push repository to your private Git repository (GitHub / GitLab).
   - Connect to Vercel or your container hosting.
   - Configure all environment variables from `.env.example` in the host dashboard.
2. **Background Scheduler Setup (2 Options)**:
   - **Option A (Vercel Cron / External Cron)**:
     Add a cron trigger hitting `https://your-domain.com/api/cron/publish` every 1 minute with header:
     `Authorization: Bearer <YOUR_CRON_SECRET>`
   - **Option B (Node.js Daemon)**:
     Run `npm run worker` as a long-running process managed by PM2 or Docker on an always-available VPS or background worker instance.

---

## 8. Feature Status Matrix

| Feature | Category | Implementation Status | Notes |
| :--- | :--- | :--- | :--- |
| **Admin Dashboard** | Phase 1 MVP | Completed | Scheduled, published, failed counters, channel health pills |
| **Post Creation** | Phase 1 MVP | Completed | Image upload, base caption, custom captions, live previews |
| **Multi-Channel Previews** | Phase 1 MVP | Completed | Dedicated Facebook, Instagram, and GBP visual previews |
| **Content Calendar** | Phase 1 MVP | Completed | Monthly calendar grid in Asia/Kolkata timezone |
| **Publishing History** | Phase 1 MVP | Completed | Per-destination statuses, error logs, technical trace modal |
| **Targeted Retry** | Phase 1 MVP | Completed | Only dispatches to failed targets; skips published |
| **Duplicate Prevention** | Reliability | Completed | Idempotency keys & pre-publish feed inspection |
| **Token Security** | Security | Completed | AES-256-GCM encryption with IV and authentication tag |
| **Multi-Tenant RLS** | Database | Completed | Workspace isolation with PostgreSQL Row-Level Security |
| **Audit Logs** | Security | Completed | Audits post creation, publishing, retry, disconnect |
| **Meta OAuth & Publishing** | API Integration | Ready for Verification | Tested against v21.0 specs; needs App Review for public |
| **Google Business Live Posting** | API Integration | Externally Blocked | Guarded & disabled until Google Cloud API access is granted |
