import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postSetId: string }> }
) {
  try {
    const { postSetId } = await params;
    const postSet = await db.postSet.findUnique({
      where: { id: postSetId },
      include: {
        posts: {
          orderBy: { scheduledAt: 'asc' }
        },
        account: {
          select: {
            id: true,
            label: true,
            timezone: true,
            platforms: true,
            pillars: true
          }
        }
      }
    });

    if (!postSet) {
      return NextResponse.json({ error: 'Post set not found' }, { status: 404 });
    }

    return NextResponse.json(postSet);
  } catch (error) {
    console.error('Error fetching post set:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postSetId: string }> }
) {
  try {
    await params; // Await params for Next.js 15 compatibility
    const body = await request.json();
    const { posts: updatedPosts } = body;

    if (!updatedPosts || !Array.isArray(updatedPosts)) {
      return NextResponse.json({ error: 'Invalid posts data' }, { status: 400 });
    }

    // Update posts
    await Promise.all(updatedPosts.map(async (post: {
      id?: string;
      title?: string;
      content: string;
      scheduledAt: string;
      approved?: boolean;
      platforms: string[];
      mediaUrls?: string[];
    }) => {
      if (post.id) {
        await db.post.update({
          where: { id: post.id },
          data: {
            title: post.title,
            content: post.content,
            scheduledAt: new Date(post.scheduledAt),
            approved: post.approved ?? false,
            platforms: JSON.stringify(post.platforms),
            mediaUrls: JSON.stringify(post.mediaUrls ?? [])
          }
        });
      }
    }));

    return NextResponse.json({ success: true, message: 'Draft saved successfully' });
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
