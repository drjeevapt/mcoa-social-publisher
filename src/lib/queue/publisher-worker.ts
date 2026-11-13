import { createAdminClient } from '@/lib/supabase/admin';
import { getPublisher } from '@/lib/publishers/registry';
import { decryptToken } from '@/lib/crypto';
import { PublishDestinationContext } from '@/lib/publishers/types';

export interface ProcessPostResult {
  postId: string;
  previousStatus: string;
  newStatus: string;
  destinationsProcessed: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  details: Array<{
    destinationId: string;
    platform: string;
    status: string;
    error?: string;
  }>;
}

/**
 * Publishes a single post across its target destinations.
 * Safe, idempotent, and updates per-destination status separately.
 * If onlySpecificDestinationIds is provided, only those destinations are executed (used for targeted retries).
 */
export async function executePostPublishing(
  postId: string,
  onlySpecificDestinationIds?: string[]
): Promise<ProcessPostResult> {
  const supabase = createAdminClient();

  // 1. Fetch post details
  const { data: postRecord, error: postErr } = await supabase
    .from('posts')
    .select('*')
    .eq('id', postId)
    .single();

  const post = postRecord as any;

  if (postErr || !post) {
    throw new Error(`Post not found: ${postId} (${postErr?.message})`);
  }

  // 2. Fetch all post destinations
  let query = supabase
    .from('post_destinations')
    .select(`
      *,
      connected_destinations (
        id,
        destination_name,
        platform_destination_id,
        destination_type,
        encrypted_destination_token,
        destination_token_iv,
        destination_token_auth_tag,
        is_enabled,
        approval_status,
        connected_accounts (
          id,
          encrypted_access_token,
          token_iv,
          token_auth_tag,
          status
        )
      )
    `)
    .eq('post_id', postId);

  if (onlySpecificDestinationIds && onlySpecificDestinationIds.length > 0) {
    query = query.in('destination_id', onlySpecificDestinationIds);
  }

  const { data, error: destErr } = await query;
  if (destErr) {
    throw new Error(`Failed to load destinations for post ${postId}: ${destErr.message}`);
  }

  const destinations: any[] = (data as any[]) || [];

  // Mark post as 'publishing'
  await (supabase
    .from('posts') as any)
    .update({ status: 'publishing' })
    .eq('id', postId);

  const resultDetails: ProcessPostResult['details'] = [];
  let successCount = 0;
  let failureCount = 0;
  let skippedCount = 0;

  // Process each destination separately
  for (const item of (destinations || [])) {
    // 3. Skip already published destinations to prevent duplicates!
    if (item.status === 'published') {
      skippedCount++;
      resultDetails.push({
        destinationId: item.destination_id,
        platform: item.platform,
        status: 'skipped (already published)',
      });
      continue;
    }

    const destMeta = (item as any).connected_destinations;
    if (!destMeta || !destMeta.is_enabled) {
      failureCount++;
      const errMsg = 'Destination is disconnected or disabled';
      await (supabase
        .from('post_destinations') as any)
        .update({
          status: 'failed',
          error_code: 'DESTINATION_DISABLED',
          error_message: errMsg,
          attempts: item.attempts + 1,
          last_attempted_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      resultDetails.push({
        destinationId: item.destination_id,
        platform: item.platform,
        status: 'failed',
        error: errMsg,
      });
      continue;
    }

    // Determine access token: Page/Destination specific token or parent account token
    let rawToken = '';
    try {
      if (destMeta.encrypted_destination_token && destMeta.destination_token_iv && destMeta.destination_token_auth_tag) {
        rawToken = decryptToken(
          destMeta.encrypted_destination_token,
          destMeta.destination_token_iv,
          destMeta.destination_token_auth_tag
        );
      } else if (destMeta.connected_accounts) {
        const acc = destMeta.connected_accounts;
        rawToken = decryptToken(
          acc.encrypted_access_token,
          acc.token_iv,
          acc.token_auth_tag
        );
      }
    } catch (decryptErr: any) {
      failureCount++;
      const errMsg = `Failed to decrypt access token: ${decryptErr.message}`;
      await (supabase
        .from('post_destinations') as any)
        .update({
          status: 'failed',
          error_code: 'TOKEN_DECRYPT_ERROR',
          error_message: errMsg,
          attempts: item.attempts + 1,
          last_attempted_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      resultDetails.push({
        destinationId: item.destination_id,
        platform: item.platform,
        status: 'failed',
        error: errMsg,
      });
      continue;
    }

    // Mark destination as 'publishing'
    await (supabase
      .from('post_destinations') as any)
      .update({ status: 'publishing' })
      .eq('id', item.id);

    // Call platform adapter
    try {
      const adapter = getPublisher(item.platform);
      const ctx: PublishDestinationContext = {
        destinationId: item.destination_id,
        platform: item.platform as any,
        platformDestinationId: destMeta.platform_destination_id,
        accessToken: rawToken,
        customCaption: item.custom_caption || undefined,
        baseCaption: post.base_caption,
        mediaUrl: post.media_url,
        mediaType: post.media_type,
        idempotentKey: item.idempotent_key,
        uncertainOutcome: item.uncertain_outcome,
      };

      const pubResult = await adapter.publish(ctx);

      if (pubResult.success) {
        successCount++;
        await (supabase
          .from('post_destinations') as any)
          .update({
            status: 'published',
            platform_post_id: pubResult.platformPostId || null,
            platform_permalink: pubResult.permalink || null,
            error_code: null,
            error_message: null,
            error_details: null,
            uncertain_outcome: false,
            attempts: item.attempts + 1,
            last_attempted_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        resultDetails.push({
          destinationId: item.destination_id,
          platform: item.platform,
          status: 'published',
        });

        // Audit log
        await (supabase.from('audit_logs') as any).insert({
          workspace_id: post.workspace_id,
          user_id: post.author_id,
          action: 'post.destination_published',
          resource_type: 'post_destination',
          resource_id: item.id,
          metadata: {
            platform: item.platform,
            platformPostId: pubResult.platformPostId,
            destinationName: destMeta.destination_name,
          },
        });
      } else {
        failureCount++;
        await (supabase
          .from('post_destinations') as any)
          .update({
            status: 'failed',
            error_code: pubResult.errorCode || 'PUBLISH_FAILED',
            error_message: pubResult.errorMessage || 'Publishing failed',
            error_details: pubResult.errorDetails || null,
            uncertain_outcome: pubResult.uncertainOutcome || false,
            attempts: item.attempts + 1,
            last_attempted_at: new Date().toISOString(),
          })
          .eq('id', item.id);

        resultDetails.push({
          destinationId: item.destination_id,
          platform: item.platform,
          status: 'failed',
          error: pubResult.errorMessage,
        });

        // Audit log
        await (supabase.from('audit_logs') as any).insert({
          workspace_id: post.workspace_id,
          user_id: post.author_id,
          action: 'post.destination_failed',
          resource_type: 'post_destination',
          resource_id: item.id,
          metadata: {
            platform: item.platform,
            errorCode: pubResult.errorCode,
            errorMessage: pubResult.errorMessage,
          },
        });
      }
    } catch (dispatchErr: any) {
      failureCount++;
      await (supabase
        .from('post_destinations') as any)
        .update({
          status: 'failed',
          error_code: 'DISPATCH_EXCEPTION',
          error_message: dispatchErr.message || 'Unexpected dispatcher error',
          attempts: item.attempts + 1,
          last_attempted_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      resultDetails.push({
        destinationId: item.destination_id,
        platform: item.platform,
        status: 'failed',
        error: dispatchErr.message,
      });
    }
  }

  // 4. Re-evaluate post overall status based on ALL destinations for this post
  const { data: allDestinations } = await supabase
    .from('post_destinations')
    .select('status')
    .eq('post_id', postId);

  const allDests: any[] = (allDestinations as any[]) || [];
  const statuses = allDests.map((d: any) => d.status);
  const total = statuses.length;
  const publishedTotal = statuses.filter((s: string) => s === 'published').length;
  const failedTotal = statuses.filter((s: string) => s === 'failed').length;

  let finalPostStatus: 'published' | 'partially_published' | 'failed' | 'scheduled' = 'published';
  let publishedAt: string | null = null;

  if (publishedTotal === total && total > 0) {
    finalPostStatus = 'published';
    publishedAt = new Date().toISOString();
  } else if (publishedTotal > 0 && failedTotal > 0) {
    finalPostStatus = 'partially_published';
    publishedAt = new Date().toISOString();
  } else if (failedTotal === total && total > 0) {
    finalPostStatus = 'failed';
  }

  await (supabase
    .from('posts') as any)
    .update({
      status: finalPostStatus,
      published_at: publishedAt || post.published_at,
    })
    .eq('id', postId);

  return {
    postId,
    previousStatus: post.status,
    newStatus: finalPostStatus,
    destinationsProcessed: resultDetails.length,
    successCount,
    failureCount,
    skippedCount,
    details: resultDetails,
  };
}

/**
 * Sweeps scheduled posts that are due for publishing
 */
export async function processDueScheduledPosts(): Promise<ProcessPostResult[]> {
  const supabase = createAdminClient();
  const nowUtc = new Date().toISOString();

  // Find posts where status = 'scheduled' and scheduled_at <= NOW()
  const { data: duePosts, error } = await supabase
    .from('posts')
    .select('id, scheduled_at')
    .eq('status', 'scheduled')
    .lte('scheduled_at', nowUtc)
    .order('scheduled_at', { ascending: true })
    .limit(10);

  if (error || !duePosts || duePosts.length === 0) {
    return [];
  }

  const results: ProcessPostResult[] = [];
  for (const post of (duePosts as any[])) {
    try {
      const res = await executePostPublishing(post.id);
      results.push(res);
    } catch (postErr) {
      console.error(`[Worker] Error processing scheduled post ${post.id}:`, postErr);
    }
  }

  return results;
}
