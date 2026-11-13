import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log('Inserting sample test post into live Supabase database...');

  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      workspace_id: 'a0000000-0000-0000-0000-000000000001', // MCOA workspace
      title: 'CPC Certification Workshop Announcement',
      base_caption: 'Medical Coding Officers Academy is thrilled to announce our upcoming CPC Certification Intensive Training. Join us to elevate your healthcare career! #MedicalCoding #CPC #HealthcareCareers',
      media_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
      media_type: 'image/jpeg',
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    console.error('Error inserting post:', error.message);
    process.exit(1);
  }

  console.log('SUCCESS! Sample post created:');
  console.log('  ID:', post.id);
  console.log('  Caption:', post.base_caption);
  console.log('  Status:', post.status);
  console.log('  Created At:', post.created_at);
}

main().catch(console.error);
