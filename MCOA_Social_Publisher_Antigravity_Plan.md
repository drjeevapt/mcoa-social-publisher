# MCOA Social Publisher: Plan and Antigravity Prompt

Prepared for Medical Coding Officers Academy | 13 November 2026

## Goal

Create a secure app to prepare a post once and publish or schedule it for selected Facebook Pages, Instagram professional accounts, and Google Business Profile locations. Each platform publishes independently, so the app must report separate results and allow retrying only failed destinations.

## Platform requirements

- **Facebook:** Connect an authorized Facebook Page using official Meta login and the permissions required for the publishing features.
- **Instagram:** Use an eligible professional account and the relevant Meta publishing permissions. With the Facebook Login route, link the professional Instagram account to a Facebook Page. Supported media and account capabilities vary.
- **Google Business Profile:** Connect an authorized business location. Google must approve API access for the Google Cloud project before live integration. Google policies apply to service providers managing customer profiles.
- Verify current API specifications, permissions, review requirements, media constraints, and policies before implementation and launch.

Official references: [Instagram API documentation](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api), [Google Business Profile API access prerequisites](https://developers.google.com/my-business/content/prereqs), [Google posts API](https://developers.google.com/my-business/content/posts-data), and [Google API policies](https://developers.google.com/my-business/content/policies).

## MCOA workflow

1. Upload an image and write a main caption.
2. Choose Facebook, Instagram, and/or eligible Google Business Profile locations.
3. Adjust the caption and call to action for each platform; preview each version.
4. Publish immediately or schedule in Asia/Kolkata time.
5. Review the separate result for every destination; retry a failure without duplicating successful posts.

## Development stages

### Stage 1: Private MCOA MVP

- Secure admin login; connect one Facebook Page and one Instagram account.
- Connect eligible Google Business locations after project approval.
- Single-image posts, drafts, platform-specific captions, preview, immediate publishing and scheduling.
- Calendar, publishing history, destination-specific statuses, error messages, reconnect prompts and targeted retry.
- Add video, reels and carousel support after validating basic publishing and current platform requirements.

### Stage 2: Scalable SaaS

- Separate customer workspaces with strong data isolation.
- Multiple brands, branches, connected accounts and team roles.
- Content approval workflow, reusable templates and content calendar.
- Optional AI-assisted English and Tamil captions with human review.
- Billing, subscriptions, usage limits, support tools and audit history.
- Pilot with training institutes, clinics and local businesses before expanding.

## Suggested stack

| Component | Suggested technology |
| --- | --- |
| Frontend | Next.js / React with TypeScript |
| Backend | Node.js / TypeScript |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Media | Supabase Storage or compatible object storage |
| Scheduling | Durable job queue and independently running worker |
| Integrations | Official Meta and Google APIs |
| Hosting | Frontend hosting plus suitable always-available worker hosting |
| Payments later | Indian payment gateway |

Architecture: dashboard → backend and database → durable job queue → platform-specific workers → separate delivery results. The scheduler must work when the browser is closed.

## Indicative timeline and costs

A basic private MVP may take approximately 5–10 weeks, depending on development capacity, testing and integration complexity. API access and review may extend the timeline. A commercial SaaS requires additional work for billing, team administration, security, support and reliability.

Initial infrastructure planning assumption: ₹2,000–₹8,000 per month for a small pilot. Actual costs depend on usage, storage, media processing, vendors and AI services. Development labour, legal work and paid platform services are additional. These figures are estimates, not quotations.

## Production requirements

- Official OAuth; never collect users' social media passwords.
- Encrypt provider tokens on the server, apply least privilege and support disconnect and deletion.
- Workspace isolation using database policies and server-side authorization.
- Durable scheduling, separate per-destination state, idempotent processing and safe retries.
- Explicit handling of uncertain publishing results so retries do not silently duplicate posts.
- Validate content and media against current provider requirements.
- Audit logs, monitoring, connection health alerts, backups and recovery procedures.
- No scraping or browser automation to bypass platform permissions.
- Do not claim production readiness until security and real publishing have been tested.

# Ready-to-use Antigravity instruction

Copy the following prompt into Antigravity:

```text
Build a production-oriented MVP for a social media publishing platform
called “MCOA Social Publisher”.

Goal:
Allow an authorized MCOA administrator to create one post and publish
or schedule it for supported Facebook Pages, Instagram professional
accounts, and Google Business Profile locations.

Technology:
- Next.js with TypeScript
- Supabase PostgreSQL and Supabase Auth
- Supabase Storage for media
- A durable background job queue and worker for scheduled publishing
- Official Meta and Google APIs only

MVP features:
1. Secure login and an admin dashboard.
2. Connect and disconnect social accounts using official OAuth.
3. Create, edit, save, and delete drafts.
4. Upload and preview a single image.
5. Write a base caption and customize it for each destination.
6. Select connected accounts and eligible Google Business locations.
7. Publish immediately or schedule using the Asia/Kolkata timezone.
8. Show a separate status and error message for every destination.
9. Retry only failed destinations without duplicating successful posts.
10. Show a calendar and publishing history.

Architecture and security:
- Design for multiple customer workspaces, but enable only the MCOA
  workspace initially.
- Enforce workspace isolation in PostgreSQL row-level security AND
  server-side authorization.
- Encrypt provider tokens and never expose them to the browser.
- Use idempotent job processing, bounded retries, and audit logs.
- Handle uncertain provider responses without blindly retrying posts.
- Validate media and post content against current provider requirements.
- Do not use scraping, browser automation, or password collection.
- Do not simulate a successful connection or publishing result.

Platform integration:
- Implement Facebook and Instagram using current official Meta APIs.
- Prepare Google Business Profile integration, but enable live posting
  only after the Google Cloud project receives the required API access.
- Make account permissions and review requirements explicit in setup.
- Use provider adapters so additional platforms can be added later.

Deliverables:
- Complete source code and database migrations.
- An environment variable template without real secrets.
- Step-by-step setup for Supabase, Meta, and Google.
- A private staging deployment guide.
- Tests for authorization, workspace isolation, scheduling, retries,
  uncertain outcomes, and duplicate prevention.
- A clear list of features that need platform approval or live testing.

First inspect the current project. Present an implementation plan,
then build in small phases. Do not claim the app is production-ready
until integrations, security, and real publishing have been tested.
```
