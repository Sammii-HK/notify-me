import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendWithFallback } from '@/lib/scheduler';
import { notifyBoth } from '@/lib/notifications';

// type Post = {
//   title?: string;
//   content: string;
//   scheduledAt: Date;
//   mediaUrls?: string;
//   approved: boolean;
//   platforms: string[];
//   id: string;
//   postSetId: string;
//   accountId: string;
//   postSet: PostSet;
// };

interface Post {
  title?: string;
  content: string;
  scheduledAt: Date;
  mediaUrls?: string;
  approved: boolean;
  platforms: string[];
  id: string;
  postSetId: string;
  accountId: string;
  postSet: PostSet;
};

type PostSet = {
  id: string;
  weekStart: Date;
  status: string;
  account: Account;
  posts: Post[];
};

type Account = {
  id: string;
  label: string;
  platforms: string;
};

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
      postsToSend = postSet.posts.filter((post: { approved: boolean; }) => post.approved);
    }

    if (postsToSend.length === 0) {
      return NextResponse.json({
        error: 'No posts selected for approval' 
      }, { status: 400 });
    }

    // Prepare posts for scheduler
    const schedulerPosts = postsToSend.map((post: Post) => ({
      title: post.title ?? '',
      content: post.content,
      platforms: JSON.parse(postSet.account.platforms),
      scheduledDate: new Date(post.scheduledAt).toISOString(),
      mediaUrls: JSON.parse(post.mediaUrls ?? '[]')
    }));

    // Send with fallback system
    const result = await sendWithFallback(schedulerPosts);

    if (!result.success) {
      // If all schedulers failed, provide export options
      await notifyBoth(
        'Scheduler Unavailable - Export Ready', 
        `Posts for "${postSet.account.label}" couldn't be sent automatically. Export files are available at: ${process.env.APP_URL}/api/export/${postSetId}`,
        `${process.env.APP_URL}/api/export/${postSetId}`
      );
      
      return NextResponse.json({ 
        success: false,
        error: 'All schedulers unavailable',
        fallback: {
          message: 'Export files generated for manual import',
          exportUrl: `/api/export/${postSetId}`,
          availableFormats: ['buffer', 'later', 'hootsuite', 'json'],
          exports: (result.result as { exports?: unknown[] })?.exports || []
        }
      }, { status: 206 }); // 206 Partial Content - fallback used
    }

    // Update post set status
    await db.postSet.update({
      where: { id: postSetId },
      data: { status: 'sent' }
    });

    type PostForDedupe = typeof postSet.posts[number];

    // Add to dedupe
    await db.dedupe.createMany({
      data: postSet.posts.map((post: PostForDedupe) => ({
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
      externalId: (result.result as { externalId?: string })?.externalId
    });
  } catch (error) {
    console.error('Error approving posts:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
