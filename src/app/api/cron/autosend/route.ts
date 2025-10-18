import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSchedulerAdapter } from '@/lib/scheduler';
import { notifyBoth } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  // Verify cron token
  const cronToken = request.headers.get('x-cron-token');
  if (cronToken !== process.env.CRON_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    
    // Find pending post sets
    const whereClause = accountId 
      ? { status: 'pending' as const, accountId }
      : { status: 'pending' as const };

    const postSets = await db.postSet.findMany({
      where: whereClause,
      include: {
        posts: true,
        account: true
      }
    });

    if (postSets.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending post sets found',
        sentCount: 0
      });
    }

    const scheduler = getSchedulerAdapter();
    const results = [];

    for (const postSet of postSets) {
      try {
        // Prepare posts for scheduler
        const schedulerPosts = postSet.posts.map(post => ({
          title: post.title ?? '',
          content: post.content,
          platforms: JSON.parse(postSet.account.platforms),
          scheduledDate: post.scheduledAt.toISOString(),
          mediaUrls: JSON.parse(post.mediaUrls ?? '[]')
        }));

        // Send to scheduler
        const result = await scheduler.sendBulk(schedulerPosts);

        if (result.ok) {
          // Update post set status
          await db.postSet.update({
            where: { id: postSet.id },
            data: { status: 'sent' }
          });

          // Add to dedupe
          await db.dedupe.createMany({
            data: postSet.posts.map(post => ({
              accountId: postSet.accountId,
              title: post.title ?? '',
              contentHash: post.contentHash
            }))
          });

          await notifyBoth(
            'Posts Auto-Sent',
            `Weekly posts automatically sent for ${postSet.account.label}`
          );

          results.push({
            postSetId: postSet.id,
            accountLabel: postSet.account.label,
            status: 'sent',
            postsCount: postSet.posts.length,
            externalId: result.externalId
          });
        } else {
          // Update post set status to failed
          await db.postSet.update({
            where: { id: postSet.id },
            data: { status: 'failed' }
          });

          await notifyBoth(
            'Auto-Send Failed',
            `Failed to send weekly posts for ${postSet.account.label}: ${result.error}`
          );

          results.push({
            postSetId: postSet.id,
            accountLabel: postSet.account.label,
            status: 'failed',
            error: result.error
          });
        }
      } catch (error) {
        console.error(`Error auto-sending posts for set ${postSet.id}:`, error);
        
        await db.postSet.update({
          where: { id: postSet.id },
          data: { status: 'failed' }
        });

        results.push({
          postSetId: postSet.id,
          accountLabel: postSet.account.label,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const sentCount = results.filter(r => r.status === 'sent').length;

    return NextResponse.json({
      success: true,
      sentCount,
      totalProcessed: results.length,
      results
    });
  } catch (error) {
    console.error('Autosend cron error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
