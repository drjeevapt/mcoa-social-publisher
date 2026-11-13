import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import { processDueScheduledPosts } from '../src/lib/queue/publisher-worker';
import { formatInKolkata } from '../src/lib/date-utils';

const POLL_INTERVAL_MS = 30000; // 30 seconds
let isRunning = true;

async function runWorkerLoop() {
  console.log(`[Worker] MCOA Social Publisher Background Worker started at ${formatInKolkata(new Date())}`);
  console.log(`[Worker] Polling every ${POLL_INTERVAL_MS / 1000} seconds for due posts...`);

  const runOnce = process.argv.includes('--once');

  while (isRunning) {
    try {
      const nowFormatted = formatInKolkata(new Date());
      const results = await processDueScheduledPosts();

      if (results.length > 0) {
        console.log(`[Worker ${nowFormatted}] Processed ${results.length} scheduled posts:`);
        for (const r of results) {
          console.log(`  - Post ${r.postId}: Status=${r.newStatus}, Succeeded=${r.successCount}, Failed=${r.failureCount}, Skipped=${r.skippedCount}`);
        }
      }
    } catch (err) {
      console.error(`[Worker Error] ${formatInKolkata(new Date())}:`, err);
    }

    if (runOnce) {
      console.log('[Worker] Single run completed. Exiting.');
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

process.on('SIGINT', () => {
  console.log('\n[Worker] Received SIGINT. Shutting down gracefully...');
  isRunning = false;
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[Worker] Received SIGTERM. Shutting down gracefully...');
  isRunning = false;
  process.exit(0);
});

runWorkerLoop();
