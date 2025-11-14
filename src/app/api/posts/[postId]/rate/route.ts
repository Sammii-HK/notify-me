import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

/**
 * POST /api/posts/[postId]/rate
 * Rate a post (good/bad)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const { rating, userId } = body;

    if (!rating || !['good', 'bad'].includes(rating)) {
      return NextResponse.json(
        { error: 'Rating must be "good" or "bad"' },
        { status: 400 }
      );
    }

    // Check if post exists
    const post = await db.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user already rated this post
    let ratingRecord;
    if (userId) {
      const existing = await db.postRating.findFirst({
        where: {
          postId,
          userId
        }
      });

      if (existing) {
        ratingRecord = await db.postRating.update({
          where: { id: existing.id },
          data: { rating }
        });
      } else {
        ratingRecord = await db.postRating.create({
          data: {
            postId,
            userId,
            rating
          }
        });
      }
    } else {
      // Anonymous rating - just create new one
      ratingRecord = await db.postRating.create({
        data: {
          postId,
          userId: null,
          rating
        }
      });
    }

    return NextResponse.json({
      success: true,
      rating: ratingRecord
    });
  } catch (error) {
    console.error('Rating error:', error);
    return NextResponse.json(
      {
        error: 'Failed to rate post',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/posts/[postId]/rate
 * Get ratings for a post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    const ratings = await db.postRating.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' }
    });

    const goodCount = ratings.filter(r => r.rating === 'good').length;
    const badCount = ratings.filter(r => r.rating === 'bad').length;

    return NextResponse.json({
      ratings,
      summary: {
        good: goodCount,
        bad: badCount,
        total: ratings.length
      }
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get ratings',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
