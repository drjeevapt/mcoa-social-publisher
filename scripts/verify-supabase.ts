import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Testing connection to Supabase project:', supabaseUrl);

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase credentials in environment.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // 1. Check workspaces table
  console.log('\n--- Checking Tables ---');
  const { data: workspaces, error: wsError } = await supabase.from('workspaces').select('*');
  if (wsError) {
    console.log('Table "workspaces": NOT FOUND or ERROR:', wsError.message);
    console.log('Action needed: Please run the migration script in Supabase SQL Editor:');
    console.log('  supabase/migrations/20261113000001_initial_schema.sql');
    console.log('  supabase/migrations/20261113000002_seed_mcoa_workspace.sql');
  } else {
    console.log('Table "workspaces": SUCCESS. Found', workspaces.length, 'records.');
    for (const ws of workspaces) {
      console.log('  -> Workspace:', ws.name, '| Slug:', ws.slug, '| Timezone:', ws.timezone);
    }
  }

  // 2. Check posts table
  const { data: posts, error: postsError } = await supabase.from('posts').select('*').limit(5);
  if (postsError) {
    console.log('Table "posts": NOT FOUND or ERROR:', postsError.message);
  } else {
    console.log('Table "posts": SUCCESS. Currently has', posts.length, 'posts.');
  }

  // 3. Check storage buckets
  console.log('\n--- Checking Storage Buckets ---');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.log('Storage buckets check ERROR:', bucketsError.message);
  } else {
    const bucketNames = (buckets || []).map((b) => b.name);
    console.log('Found buckets:', bucketNames);

    if (bucketNames.includes('social-media-assets')) {
      console.log('Bucket "social-media-assets": EXISTS and is ready.');
    } else {
      console.log('Bucket "social-media-assets" not found. Attempting to create it automatically...');
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('social-media-assets', {
        public: true,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      });

      if (createError) {
        console.log('Could not auto-create bucket:', createError.message);
        console.log('Please create it manually in Supabase Dashboard -> Storage -> New Bucket -> "social-media-assets" (Public).');
      } else {
        console.log('Bucket "social-media-assets": CREATED SUCCESSFULLY as Public bucket.');
      }
    }
  }
}

main().catch((err) => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
