import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSchedulerAdapter } from '@/lib/scheduler';
import { notifyBoth } from '@/lib/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postSetId: string }> }
) {
  try {
    const { postSetId } = await params;
    const postSet = await db.postSet.findUnique({
      where: { id: postSetId },
      include: {
        posts: true,
        account: true
      }
    });

    if (!postSet) {
      return NextResponse.json({ error: 'Post set not found' }, { status: 404 });
    }

    if (postSet.status !== 'pending') {
      return NextResponse.json({ 
        error: `Post set already ${postSet.status}` 
      }, { status: 400 });
    }

    // Use edited posts from request body if provided, otherwise use approved posts
    const body = await request.json();
    const { posts: editedPosts } = body || {};
    
    let postsToSend;
    if (editedPosts && Array.isArray(editedPosts)) {
      postsToSend = editedPosts;
    } else {
      postsToSend = postSet.posts.filter(post => post.approved);
    }

    if (postsToSend.length === 0) {
      return NextResponse.json({ 
        error: 'No posts selected for approval' 
      }, { status: 400 });
    }

    // Prepare posts for scheduler
    const schedulerPosts = postsToSend.map((post: {
      title?: string;
      content: string;
      scheduledAt: Date;
      mediaUrls?: string;
    }) => ({
      title: post.title ?? '',
      content: post.content,
      platforms: JSON.parse(postSet.account.platforms),
      scheduledDate: new Date(post.scheduledAt).toISOString(),
      mediaUrls: JSON.parse(post.mediaUrls ?? '[]')
    }));

    // Send to scheduler
    const scheduler = getSchedulerAdapter();
    const result = await scheduler.sendBulk(schedulerPosts);

    if (!result.ok) {
      return NextResponse.json({ 
        error: 'Failed to send posts to scheduler',
        details: result.error
      }, { status: 502 });
    }

    // Update post set status
    await db.postSet.update({
      where: { id: postSetId },
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

    // Send notifications
    await notifyBoth(
      'Posts Approved & Sent',
      `Weekly posts approved and sent for ${postSet.account.label} (${postsToSend.length} posts)`
    );

    return NextResponse.json({
      success: true,
      message: 'Posts approved and sent successfully',
      sentCount: postsToSend.length,
      externalId: result.externalId
    });
  } catch (error) {
    console.error('Error approving posts:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
