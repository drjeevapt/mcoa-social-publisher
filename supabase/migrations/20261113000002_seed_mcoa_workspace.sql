-- ====================================================================
-- MCOA Default Workspace Seed
-- ====================================================================

INSERT INTO public.workspaces (id, name, slug, timezone, settings)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Medical Coding Officers Academy',
    'mcoa',
    'Asia/Kolkata',
    '{
        "notifications": {
            "failed_post_alert": true,
            "weekly_summary": false
        },
        "branding": {
            "name": "Medical Coding Officers Academy",
            "tagline": "Empowering Healthcare Professionals with World-Class Medical Coding Training",
            "primary_color": "#09090b",
            "accent_color": "#d4af37"
        }
    }'::jsonb
)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    timezone = EXCLUDED.timezone;
