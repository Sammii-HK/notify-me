import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { processFeedbackForLearning } from '@/lib/ml-learning';

/**
 * POST /api/posts/[postId]/feedback
 * Submit detailed feedback for ML learning
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const body = await request.json();
    const {
      rating,
      feedback,
      metrics,
      tags,
      userId
    } = body;

    if (!rating || !['good', 'bad', 'neutral'].includes(rating)) {
      return NextResponse.json(
        { error: 'Rating must be "good", "bad", or "neutral"' },
        { status: 400 }
      );
    }

    // Check if post exists and get account
    const post = await db.post.findUnique({
      where: { id: postId },
      include: {
        postSet: {
          include: {
            account: true
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user already provided feedback for this post
    let feedbackRecord;
    if (userId) {
      const existing = await db.postFeedback.findFirst({
        where: {
          postId,
          userId
        }
      });

      if (existing) {
        feedbackRecord = await db.postFeedback.update({
          where: { id: existing.id },
          data: {
            rating,
            feedback: feedback || null,
            metrics: metrics ? JSON.stringify(metrics) : null,
            tags: tags ? JSON.stringify(tags) : null
          }
        });
      } else {
        feedbackRecord = await db.postFeedback.create({
          data: {
            postId,
            userId,
            rating,
            feedback: feedback || null,
            metrics: metrics ? JSON.stringify(metrics) : null,
            tags: tags ? JSON.stringify(tags) : null
          }
        });
      }
    } else {
      // Anonymous feedback - just create new one
      feedbackRecord = await db.postFeedback.create({
        data: {
          postId,
          userId: null,
          rating,
          feedback: feedback || null,
          metrics: metrics ? JSON.stringify(metrics) : null,
          tags: tags ? JSON.stringify(tags) : null
        }
      });
    }

    // Process feedback for ML learning (async, don't wait)
    processFeedbackForLearning(
      db,
      post.postSet.accountId,
      postId,
      feedbackRecord
    ).catch(err => {
      console.error('ML learning processing error (non-fatal):', err);
    });

    return NextResponse.json({
      success: true,
      feedback: feedbackRecord
    });
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit feedback',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/posts/[postId]/feedback
 * Get feedback for a post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    const feedbacks = await db.postFeedback.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      feedbacks: feedbacks.map(f => ({
        ...f,
        metrics: f.metrics ? JSON.parse(f.metrics) : null,
        tags: f.tags ? JSON.parse(f.tags) : null
      }))
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get feedback',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
